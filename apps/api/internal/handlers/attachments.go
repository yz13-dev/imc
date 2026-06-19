package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"path"
	"strconv"
	"strings"

	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
	"github.com/yz13-dev/imc/api/internal/middleware"
	"github.com/yz13-dev/imc/api/internal/models"
	"github.com/yz13-dev/imc/api/internal/services"
	"github.com/yz13-dev/imc/api/internal/storage"
	"github.com/yz13-dev/imc/api/internal/utils"
)

func GetInboxAttachments(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.GetUser(r.Context())
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}

	userID := user.ID.(int64) // as uint64

	db, ok := middleware.GetDB(r.Context())
	if !ok {
		http.Error(w, "database not found", http.StatusInternalServerError)
		return
	}

	attachments, err := services.GetInboxAttachments(userID, db)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(attachments); err != nil {
		http.Error(
			w,
			"failed to encode response",
			http.StatusInternalServerError,
		)
	}
}

func PostNewAttachment(w http.ResponseWriter, r *http.Request) {

	user, ok := middleware.GetUser(r.Context())
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}

	db, ok := middleware.GetDB(r.Context())
	if !ok {
		http.Error(w, "database not found", http.StatusInternalServerError)
		return
	}

	userID := user.ID.(int64) // as uint64

	s3Client, err := storage.NewS3Client()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "missing file", http.StatusBadRequest)
		return
	}

	var ImageWidth, ImageHeight int

	fileSize := header.Size

	contentType := header.Header.Get("Content-Type")
	log.Println("[ EXT ]", contentType)
	ext := map[string]string{
		"image/jpeg": ".jpg",
		"image/png":  ".png",
		"image/webp": ".webp",
		"video/mp4":  ".mp4",
	}[contentType]

	isImage := strings.HasPrefix(contentType, "image/")

	var Blurhash string = ""

	if isImage {
		img, _, err := image.Decode(file)
		Width, Height, Hash, err := utils.GetImageMetadata(img)

		_, err = file.Seek(0, io.SeekStart)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if Hash != "" {
			Blurhash = Hash
		}
		if Width > 0 {
			ImageWidth = Width
		}
		if Height > 0 {
			ImageHeight = Height
		}
	}
	defer file.Close()

	attachmentID := uuid.NewString()

	log.Println("ext", ext)

	key := fmt.Sprintf(
		"users/%d/attachments/%s%s",
		userID,
		attachmentID,
		path.Ext(header.Filename),
	)

	_, err = s3Client.PutObject(r.Context(), &s3.PutObjectInput{
		Bucket:      aws.String(storage.GetBucketName()),
		Key:         aws.String(key),
		Body:        file,
		ContentType: aws.String(header.Header.Get("Content-Type")),
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	Type, _, _ := strings.Cut(contentType, "/")
	MimeType := contentType
	createdAttachement, err := services.PostNewAttachment(userID, db, models.NewAttachment{
		Type:     Type,
		MimeType: MimeType,
		FileSize: fileSize,
		Src:      key,
		CardID:   nil,
		Width:    ImageWidth,
		Height:   ImageHeight,
		UserID:   userID,
		Blurhash: Blurhash,
	})

	type response struct {
		Key string `json:"key"`
		ID  string `json:"id"`
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response{
		Key: key,
		ID:  createdAttachement.ID,
	})
}

func GetAttachmentFile(w http.ResponseWriter, r *http.Request) {
	attachmentID := r.PathValue("attachmentID")
	if attachmentID == "" {
		http.Error(w, "attachmentID is required", http.StatusBadRequest)
		return
	}

	user, ok := middleware.GetUser(r.Context())
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}

	userID := user.ID.(int64) // as uint64

	key := fmt.Sprintf(
		"users/%d/attachments/%s",
		userID,
		attachmentID,
	)
	log.Println("key", key)

	s3Client, err := storage.NewS3Client()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	obj, err := s3Client.GetObject(r.Context(), &s3.GetObjectInput{
		Bucket: aws.String(storage.GetBucketName()),
		Key:    aws.String(key),
	})
	log.Println("obj", err)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer obj.Body.Close()

	if obj.ContentType != nil {
		w.Header().Set("Content-Type", *obj.ContentType)
	}

	if obj.ContentLength != nil {
		w.Header().Set("Content-Length", strconv.FormatInt(*obj.ContentLength, 10))
	}
	w.Header().Set("Content-Disposition", "inline")
	_, err = io.Copy(w, obj.Body)
	if err != nil {
		log.Printf("copy object body: %v", err)
	}
}

func GetAttachment(w http.ResponseWriter, r *http.Request) {
	attachmentID := r.PathValue("attachmentID")
	if attachmentID == "" {
		http.Error(w, "attachmentID is required", http.StatusBadRequest)
		return
	}

	user, ok := middleware.GetUser(r.Context())
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}

	userID := user.ID.(int64) // as uint64

	db, ok := middleware.GetDB(r.Context())
	if !ok {
		http.Error(w, "database not found", http.StatusInternalServerError)
		return
	}

	attachment, err := services.GetAttachment(userID, attachmentID, db)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(attachment); err != nil {
		http.Error(
			w,
			"failed to encode response",
			http.StatusInternalServerError,
		)
	}
}
