package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/google/uuid"
	"github.com/yz13-dev/imc/api/internal/events"
	"github.com/yz13-dev/imc/api/internal/middleware"
	"github.com/yz13-dev/imc/api/internal/models"
	"github.com/yz13-dev/imc/api/internal/services"
)

func GetTagsSearch(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")

	if query == "" {
		http.Error(w, "query is required", http.StatusBadRequest)
		return
	}

	user, ok := middleware.GetUser(r.Context())
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}

	userID := user.ID

	db, ok := middleware.GetDB(r.Context())
	if !ok {
		http.Error(w, "database not found", http.StatusInternalServerError)
		return
	}

	tags, err := services.SearchTags(query, userID, db)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(tags); err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
	}
}

func PostNewTag(w http.ResponseWriter, r *http.Request) {
	decoder := json.NewDecoder(r.Body)
	var tag struct {
		Name string `json:"name"`
	}
	if err := decoder.Decode(&tag); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if tag.Name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}

	user, ok := middleware.GetUser(r.Context())
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}

	userID := user.ID

	db, ok := middleware.GetDB(r.Context())
	if !ok {
		http.Error(w, "database not found", http.StatusInternalServerError)
		return
	}

	createdTag, err := services.CreateTag(tag.Name, userID, db)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	hub := middleware.GetEventsHub(r.Context())
	if hub == nil {
		log.Println("events hub not found")
		return
	}

	const EventKey = "tag:new"
	hub.Publish(userID, events.Event{
		Type: EventKey,
		Data: models.EventData{
			ID: createdTag.ID.String(),
		},
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(createdTag); err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
	}
}

func PostConnectAttachmentTag(w http.ResponseWriter, r *http.Request) {
	decoder := json.NewDecoder(r.Body)
	var tag struct {
		TagID string `json:"tagID"`
	}
	if err := decoder.Decode(&tag); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if tag.TagID == "" {
		http.Error(w, "tagID is required", http.StatusBadRequest)
		return
	}

	_, ok := middleware.GetUser(r.Context())
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}

	// userID := user.ID.(int64) // as uint64

	db, ok := middleware.GetDB(r.Context())
	if !ok {
		http.Error(w, "database not found", http.StatusInternalServerError)
		return
	}

	attachmentID, err := uuid.Parse(r.PathValue("attachmentID"))
	if err != nil {
		http.Error(w, "attachmentID is required", http.StatusBadRequest)
		return
	}
	tagID, err := uuid.Parse(tag.TagID)
	if err != nil {
		http.Error(w, "tagID is required", http.StatusBadRequest)
		return
	}

	err = services.ConnectTagToAttachment(tagID, attachmentID, db)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func DeleteDisconnectAttachmentTag(w http.ResponseWriter, r *http.Request) {
	decoder := json.NewDecoder(r.Body)
	var tag struct {
		TagID string `json:"tagID"`
	}
	if err := decoder.Decode(&tag); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if tag.TagID == "" {
		http.Error(w, "tagID is required", http.StatusBadRequest)
		return
	}

	_, ok := middleware.GetUser(r.Context())
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}

	// userID := user.ID.(int64) // as uint64

	db, ok := middleware.GetDB(r.Context())
	if !ok {
		http.Error(w, "database not found", http.StatusInternalServerError)
		return
	}

	attachmentID, err := uuid.Parse(r.PathValue("attachmentID"))
	if err != nil {
		http.Error(w, "attachmentID is required", http.StatusBadRequest)
		return
	}
	tagID, err := uuid.Parse(tag.TagID)
	if err != nil {
		http.Error(w, "tagID is required", http.StatusBadRequest)
		return
	}

	err = services.DisconnectTagFromAttachment(tagID, attachmentID, db)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
