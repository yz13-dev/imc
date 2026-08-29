package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/joho/godotenv"
	"github.com/openai/openai-go"
	"github.com/yz13-dev/imc/api/internal/ai"
	"github.com/yz13-dev/imc/api/internal/database"
	"github.com/yz13-dev/imc/api/internal/models"
	"github.com/yz13-dev/imc/api/internal/repositories"
	"github.com/yz13-dev/imc/api/internal/storage"
	"github.com/yz13-dev/imc/api/internal/utils"
	"golang.org/x/sync/errgroup"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// See cmd/api/main.go's GetDSN for why search_path=imc is required here too —
// this binary opens its own separate connection to the same monolithic DB.
func GetDSN() string {
	return fmt.Sprintf("postgresql://%s:%s@%s:%s/%s?options=-c%%20search_path%%3Dimc",
		os.Getenv("POSTGRES_USER"),
		os.Getenv("POSTGRES_PASSWORD"),
		os.Getenv("POSTGRES_HOST"),
		os.Getenv("POSTGRES_PORT"),
		os.Getenv("POSTGRES_DB"),
	)
}

func envInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return fallback
}

type Worker struct {
	db          *gorm.DB
	s3Client    *s3.Client
	aiClient    *openai.Client
	batchSize   int
	concurrency int
	maxAttempts int
}

const globalTagVocabularyLimit = 200

func (w *Worker) processBatch(ctx context.Context) {
	attachments, err := repositories.ClaimPendingAttachments(w.batchSize, w.db)
	if err != nil {
		log.Printf("worker: failed to claim pending attachments: %v", err)
		return
	}
	if len(attachments) == 0 {
		return
	}
	log.Printf("worker: claimed %d attachment(s)", len(attachments))

	existingTags, err := repositories.ListGlobalTagNames(globalTagVocabularyLimit, w.db)
	if err != nil {
		log.Printf("worker: failed to load global tag vocabulary: %v", err)
		existingTags = nil
	}

	g, gctx := errgroup.WithContext(ctx)
	g.SetLimit(w.concurrency)
	for _, attachment := range attachments {
		g.Go(func() error {
			w.processAttachment(gctx, attachment, existingTags)
			return nil
		})
	}
	_ = g.Wait()
}

// processAttachment never returns an error to the caller: a single failed
// attachment must not cancel the rest of the in-flight batch. Failures are
// recorded on the row itself via MarkAttachmentAIFailed instead.
func (w *Worker) processAttachment(ctx context.Context, attachment models.Attachment, existingTags []string) {
	if err := w.processAttachmentInner(ctx, attachment, existingTags); err != nil {
		log.Printf("worker: attachment %s failed: %v", attachment.ID, err)
		if markErr := repositories.MarkAttachmentAIFailed(attachment.ID, w.maxAttempts, w.db); markErr != nil {
			log.Printf("worker: failed to mark attachment %s as failed: %v", attachment.ID, markErr)
		}
	}
}

func (w *Worker) processAttachmentInner(ctx context.Context, attachment models.Attachment, existingTags []string) error {
	obj, err := w.s3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(storage.GetBucketName()),
		Key:    aws.String(attachment.Src),
	})
	if err != nil {
		return fmt.Errorf("s3 get object: %w", err)
	}
	defer obj.Body.Close()

	data, err := io.ReadAll(obj.Body)
	if err != nil {
		return fmt.Errorf("read s3 object: %w", err)
	}

	imageBytes := data
	mimeType := attachment.MimeType

	switch {
	case attachment.Type == "video":
		imageBytes, mimeType, err = extractVideoFrame(data)
		if err != nil {
			return err
		}
	case attachment.MimeType == "image/gif":
		imageBytes, err = utils.FirstGifFrameAsPNG(data)
		if err != nil {
			return fmt.Errorf("decode gif frame: %w", err)
		}
		mimeType = "image/png"
	}

	result, err := ai.AnalyzeImage(ctx, w.aiClient, imageBytes, mimeType, existingTags)
	if err != nil {
		return err
	}
	result.Tags = canonicalizeTags(result.Tags, existingTags)

	return w.db.Transaction(func(tx *gorm.DB) error {
		for _, tagName := range result.Tags {
			tag, err := repositories.FindOrCreateTag(tagName, attachment.UserID, tx)
			if err != nil {
				return fmt.Errorf("find or create tag %q: %w", tagName, err)
			}
			if err := repositories.ConnectTagToAttachment(tag.ID, attachment.ID, tx); err != nil {
				return fmt.Errorf("connect tag %q: %w", tagName, err)
			}
		}
		return repositories.MarkAttachmentAIDone(attachment.ID, result.Name, result.Description, tx)
	})
}

func canonicalizeTags(tags []string, existingTags []string) []string {
	canonical := make(map[string]string, len(existingTags))
	for _, tag := range existingTags {
		key := strings.ToLower(strings.TrimSpace(tag))
		if key != "" {
			canonical[key] = tag
		}
	}

	seen := make(map[string]struct{}, len(tags))
	result := make([]string, 0, len(tags))
	for _, tag := range tags {
		key := strings.ToLower(strings.TrimSpace(tag))
		if existing, ok := canonical[key]; ok {
			tag = existing
		}
		key = strings.ToLower(strings.TrimSpace(tag))
		if key == "" {
			continue
		}
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		result = append(result, tag)
		if len(result) == 8 {
			break
		}
	}
	return result
}

func extractVideoFrame(data []byte) (frame []byte, mimeType string, err error) {
	path, err := utils.SaveBytesToTempFile(data)
	if err != nil {
		return nil, "", fmt.Errorf("save video to temp file: %w", err)
	}
	defer os.Remove(path)

	meta, err := utils.ProbeVideo(path)
	if err != nil {
		return nil, "", fmt.Errorf("probe video: %w", err)
	}

	frame, err = utils.ExtractKeyframe(path, meta.DurationMs)
	if err != nil {
		return nil, "", fmt.Errorf("extract keyframe: %w", err)
	}

	return frame, "image/jpeg", nil
}

func startHealthServer() {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"status":    "ok",
			"timestamp": time.Now().Format(time.RFC3339),
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8083"
	}
	log.Println("worker: health endpoint listening on port", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Printf("worker: health server error: %v", err)
	}
}

func main() {
	if os.Getenv("APP_ENV") != "production" {
		_ = godotenv.Load()
	}

	gormdb, err := gorm.Open(postgres.Open(GetDSN()), &gorm.Config{})
	if err != nil {
		log.Fatalf("worker: failed to open database: %v", err)
	}
	if err := database.ConfigurePool(gormdb); err != nil {
		log.Fatalf("worker: failed to configure database pool: %v", err)
	}

	s3Client, err := storage.NewS3Client()
	if err != nil {
		log.Fatalf("worker: failed to create s3 client: %v", err)
	}

	worker := &Worker{
		db:          gormdb,
		s3Client:    s3Client,
		aiClient:    ai.NewClient(),
		batchSize:   envInt("WORKER_BATCH_SIZE", 10),
		concurrency: envInt("WORKER_CONCURRENCY", 3),
		maxAttempts: envInt("WORKER_MAX_ATTEMPTS", 3),
	}
	pollInterval := time.Duration(envInt("WORKER_POLL_INTERVAL_SECONDS", 30)) * time.Second

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	go startHealthServer()

	log.Printf("worker: starting, poll interval %s, batch size %d, concurrency %d",
		pollInterval, worker.batchSize, worker.concurrency)

	ticker := time.NewTicker(pollInterval)
	defer ticker.Stop()

	worker.processBatch(ctx)
	for {
		select {
		case <-ctx.Done():
			log.Println("worker: shutting down")
			return
		case <-ticker.C:
			worker.processBatch(ctx)
		}
	}
}
