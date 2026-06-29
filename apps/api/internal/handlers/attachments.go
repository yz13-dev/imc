package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
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
	"github.com/yz13-dev/imc/api/internal/events"
	"github.com/yz13-dev/imc/api/internal/middleware"
	"github.com/yz13-dev/imc/api/internal/models"
	"github.com/yz13-dev/imc/api/internal/repositories"
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
		"video/webm": ".webm",
	}[contentType]

	isImage := strings.HasPrefix(contentType, "image/")
	isVideo := strings.HasPrefix(contentType, "video/")

	var Blurhash string = ""
	var DurationMs int64 = 0

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
	if isVideo {
		path, err := utils.SaveToTempFile(file)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer os.Remove(path)

		_, err = file.Seek(0, io.SeekStart)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		meta, err := utils.ProbeVideo(path)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if meta.DurationMs > 0 {
			DurationMs = meta.DurationMs
		}
		if meta.Width > 0 {
			ImageWidth = meta.Width
		}
		if meta.Height > 0 {
			ImageHeight = meta.Height
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
		Type:       Type,
		MimeType:   MimeType,
		FileSize:   fileSize,
		Src:        key,
		Width:      ImageWidth,
		Height:     ImageHeight,
		UserID:     userID,
		Blurhash:   Blurhash,
		DurationMS: int(DurationMs),
	})

	type response struct {
		Key string    `json:"key"`
		ID  uuid.UUID `json:"id"`
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

	AttachmentID, err := uuid.Parse(attachmentID)
	if err != nil {
		http.Error(w, "attachmentID is invalid", http.StatusBadRequest)
		return
	}

	db, ok := middleware.GetDB(r.Context())
	if !ok {
		http.Error(w, "database not found", http.StatusInternalServerError)
		return
	}

	log.Println("ID", AttachmentID)

	log.Println("ID", AttachmentID)

	var attachment models.Attachment

	collectionAttachment, err := services.GetAttachmentWithCollection(AttachmentID, db)
	if err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if collectionAttachment != nil {
		// Вложение принадлежит коллекции
		if collectionAttachment.Collection == nil {
			http.Error(w, "collection not found", http.StatusInternalServerError)
			return
		}

		attachment = collectionAttachment.Attachment

		// Если коллекция приватная — проверяем владельца
		if !collectionAttachment.Collection.Public {
			user, ok := middleware.GetUser(r.Context())
			if !ok {
				http.Error(w, "user not found", http.StatusUnauthorized)
				return
			}

			userID := user.ID.(int64)

			if collectionAttachment.Collection.UserID != userID {
				http.Error(w, "doesn't have access", http.StatusUnauthorized)
				return
			}
		}
	} else {
		// Вложение не принадлежит коллекции — ищем публичное
		publicAttachment, err := services.GetPublicAttachment(AttachmentID, db)
		if err != nil {
			http.Error(w, "doesn't have access", http.StatusUnauthorized)
			return
		}

		attachment = publicAttachment.Attachment
	}

	key := attachment.Src
	// fmt.Sprintf(
	// 	"users/%d/attachments/%s",
	// 	userID,
	// 	attachmentID,
	// )
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

func PatchAttachment(w http.ResponseWriter, r *http.Request) {

	var data models.UpdateAttachment
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, "failed to decode request", http.StatusBadRequest)
		return
	}

	attachmentID := r.PathValue("attachmentID")
	if attachmentID == "" {
		http.Error(w, "attachmentID is required", http.StatusBadRequest)
		return
	}

	AttachmentID, err := uuid.Parse(attachmentID)
	if err != nil {
		http.Error(w, "error in attachmentID", http.StatusBadRequest)
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

	attachment, err := services.PatchAttachment(AttachmentID, userID, data, db)
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

func PostInInbox(w http.ResponseWriter, r *http.Request) {
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

	attachmentID, err := uuid.Parse(r.URL.Query().Get("attachmentID"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err = services.PostInInbox(userID, db, attachmentID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	hub := middleware.GetEventsHub(r.Context())
	if hub == nil {
		log.Println("events hub not found")
		return
	}

	const EventKey = "inbox:new"
	hub.Publish(userID, events.Event{
		Type: EventKey,
		Data: models.EventData{
			ID: attachmentID.String(),
		},
	})

	w.WriteHeader(http.StatusCreated)
}

func GetCollectionAttachments(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.GetUser(r.Context())
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}

	userID := user.ID.(int64) // as uint64

	collectionID, err := uuid.Parse(r.PathValue("collectionID"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	db, ok := middleware.GetDB(r.Context())
	if !ok {
		http.Error(w, "database not found", http.StatusInternalServerError)
		return
	}

	attachments, err := services.GetCollectionAttachments(collectionID, userID, db)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(attachments); err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
	}
}

func GetPublicCollectionAttachments(w http.ResponseWriter, r *http.Request) {

	collectionID, err := uuid.Parse(r.PathValue("collectionID"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	db, ok := middleware.GetDB(r.Context())
	if !ok {
		http.Error(w, "database not found", http.StatusInternalServerError)
		return
	}

	attachments, err := services.GetPublicCollectionAttachments(collectionID, db)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(attachments); err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
	}
}

func GetAllAttachments(w http.ResponseWriter, r *http.Request) {

	offset := r.URL.Query().Get("offset")
	limit := r.URL.Query().Get("limit")

	Offset, err := strconv.Atoi(offset)
	if err != nil {
		Offset = 0
	}
	Limit, err := strconv.Atoi(limit)
	if err != nil {
		Limit = 25
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

	attachments, err := services.GetAllAttachments(userID, repositories.ListQuery{Offset: Offset, Limit: Limit}, db)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(attachments); err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
	}
}

type DeleteAttachmentResponse struct {
	ID uuid.UUID `json:"id"`
}

func DeleteAttachment(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.GetUser(r.Context())
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}

	userID := user.ID.(int64) // as uint64

	attachmentID := r.PathValue("attachmentID")
	if attachmentID == "" {
		http.Error(w, "attachmentID is required", http.StatusBadRequest)
		return
	}

	db, ok := middleware.GetDB(r.Context())
	if !ok {
		http.Error(w, "database not found", http.StatusInternalServerError)
		return
	}

	attachment, err := services.DeleteAttachment(userID, attachmentID, db)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	s3Client, err := storage.NewS3Client()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	key := attachment.Src

	_, err = s3Client.DeleteObject(r.Context(), &s3.DeleteObjectInput{
		Bucket: aws.String(storage.GetBucketName()),
		Key:    aws.String(key),
	})

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(DeleteAttachmentResponse{ID: attachment.ID}); err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
	}
}

type TrashAttachmentResponse struct {
	ID string `json:"id"`
}

func TrashAttachment(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.GetUser(r.Context())
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}

	userID := user.ID.(int64) // as uint64

	attachmentID := r.PathValue("attachmentID")
	if attachmentID == "" {
		http.Error(w, "attachmentID is required", http.StatusBadRequest)
		return
	}

	db, ok := middleware.GetDB(r.Context())
	if !ok {
		http.Error(w, "database not found", http.StatusInternalServerError)
		return
	}

	err := services.TrashAttachment(userID, attachmentID, db)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	hub := middleware.GetEventsHub(r.Context())
	if hub == nil {
		log.Println("events hub not found")
		return
	}

	const EventKey = "trash:new"
	hub.Publish(userID, events.Event{
		Type: EventKey,
		Data: models.EventData{
			ID: attachmentID,
		},
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(TrashAttachmentResponse{ID: attachmentID}); err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
	}
}

func UnTrashAttachment(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.GetUser(r.Context())
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}

	userID := user.ID.(int64) // as uint64

	attachmentID := r.PathValue("attachmentID")
	if attachmentID == "" {
		http.Error(w, "attachmentID is required", http.StatusBadRequest)
		return
	}

	db, ok := middleware.GetDB(r.Context())
	if !ok {
		http.Error(w, "database not found", http.StatusInternalServerError)
		return
	}

	err := services.UntrashAttachment(userID, attachmentID, db)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	hub := middleware.GetEventsHub(r.Context())
	if hub == nil {
		log.Println("events hub not found")
		return
	}

	const EventKey = "trash:remove"
	hub.Publish(userID, events.Event{
		Type: EventKey,
		Data: models.EventData{
			ID: attachmentID,
		},
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(TrashAttachmentResponse{ID: attachmentID}); err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
	}
}

func GetTrashAttachments(w http.ResponseWriter, r *http.Request) {
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

	attachments, err := services.GetTrashAttachments(userID, db)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(attachments); err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
	}
}
