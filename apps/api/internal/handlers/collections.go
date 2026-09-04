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

func GetPublicCollectionHandler(w http.ResponseWriter, r *http.Request) {
	collectionID, err := uuid.Parse(r.PathValue("collectionID"))
	if err != nil {
		http.Error(w, "invalid collectionID", http.StatusBadRequest)
		return
	}
	db, ok := middleware.GetDB(r.Context())
	if !ok {
		http.Error(w, "database not found", http.StatusInternalServerError)
		return
	}
	collection, err := services.GetPublicCollectionDetails(collectionID, db)
	if err != nil {
		http.Error(w, "collection not found", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(collection)
}

func GetPublicCollectionTagsHandler(w http.ResponseWriter, r *http.Request) {
	collectionID, err := uuid.Parse(r.PathValue("collectionID"))
	if err != nil {
		http.Error(w, "invalid collectionID", http.StatusBadRequest)
		return
	}
	db, ok := middleware.GetDB(r.Context())
	if !ok {
		http.Error(w, "database not found", http.StatusInternalServerError)
		return
	}
	tags, err := services.GetPublicCollectionTagsWithCounts(collectionID, db)
	if err != nil {
		http.Error(w, "failed to load collection tags", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tags)
}

func GetMyCollectionsHandler(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.GetUser(r.Context())
	log.Println("collections", user, ok)
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

	collections, err := services.GetCollections(userID, db)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(collections); err != nil {
		http.Error(
			w,
			"failed to encode response",
			http.StatusInternalServerError,
		)
	}
}

func PostMyNewCollectionHandler(w http.ResponseWriter, r *http.Request) {
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

	var data models.NewCollection
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, "failed to decode request", http.StatusBadRequest)
		return
	}
	data.UserID = userID

	collection, err := services.CreateCollection(&data, db)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	hub := middleware.GetEventsHub(r.Context())
	if hub == nil {
		log.Println("events hub not found")
		return
	}

	const EventKey = "collections:new"
	hub.Publish(userID, events.Event{
		Type: EventKey,
		Data: models.EventData{
			ID: collection.ID.String(),
		},
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(collection); err != nil {
		http.Error(
			w,
			"failed to encode response",
			http.StatusInternalServerError,
		)
	}
}

func PostCollectionAttachments(w http.ResponseWriter, r *http.Request) {
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

	collectionID := r.PathValue("collectionID")
	if collectionID == "" {
		http.Error(w, "collection ID is required", http.StatusBadRequest)
		return
	}
	attachmentId, err := uuid.Parse(r.URL.Query().Get("attachmentID"))
	if err != nil {
		http.Error(w, "attachment ID is required", http.StatusBadRequest)
		return
	}

	collectionUUID, err := uuid.Parse(collectionID)
	if err != nil {
		http.Error(w, "collection ID is required", http.StatusBadRequest)
		return
	}
	collectionAttachment, removedFromInbox, err := services.MoveAttachmentToCollection(collectionUUID, attachmentId, userID, db)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if hub := middleware.GetEventsHub(r.Context()); hub != nil {
		if removedFromInbox {
			hub.Publish(userID, events.Event{Type: "inbox:remove", Data: models.EventData{ID: attachmentId.String()}})
		}
		hub.Publish(userID, events.Event{Type: "collection:update", Data: models.EventData{ID: collectionUUID.String()}})
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(collectionAttachment); err != nil {
		http.Error(
			w,
			"failed to encode response",
			http.StatusInternalServerError,
		)
	}
}

func DeleteCollectionAttachments(w http.ResponseWriter, r *http.Request) {
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

	collectionID := r.PathValue("collectionID")
	if collectionID == "" {
		http.Error(w, "collection ID is required", http.StatusBadRequest)
		return
	}
	attachmentId, err := uuid.Parse(r.URL.Query().Get("attachmentID"))
	if err != nil {
		http.Error(w, "attachment ID is required", http.StatusBadRequest)
		return
	}

	collection, err := services.GetCollection(collectionID, userID, db)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err := services.DeleteCollectionAttachment(collection.ID, attachmentId, db); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	hub := middleware.GetEventsHub(r.Context())
	if hub != nil {
		const CollectionEventKey = "collection:update"
		hub.Publish(userID, events.Event{
			Type: CollectionEventKey,
			Data: models.EventData{
				ID: collection.ID.String(),
			},
		})
	}

	w.WriteHeader(http.StatusNoContent)
}

func UpdateCollectionPublicHandler(w http.ResponseWriter, r *http.Request) {
	collectionID := r.PathValue("collectionID")
	if collectionID == "" {
		http.Error(w, "collectionID is required", http.StatusBadRequest)
		return
	}
	user, ok := middleware.GetUser(r.Context())
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}
	var data struct {
		Public bool `json:"public"`
	}
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, "failed to decode request", http.StatusBadRequest)
		return
	}
	db, ok := middleware.GetDB(r.Context())
	if !ok {
		http.Error(w, "database not found", http.StatusInternalServerError)
		return
	}
	collection, err := services.UpdateCollectionPublic(collectionID, user.ID, data.Public, db)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if hub := middleware.GetEventsHub(r.Context()); hub != nil {
		hub.Publish(user.ID, events.Event{Type: "collections:update", Data: models.EventData{ID: collectionID}})
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(collection)
}

func DeleteCollectionHandler(w http.ResponseWriter, r *http.Request) {
	collectionID := r.PathValue("collectionID")

	if collectionID == "" {
		http.Error(w, "collectionID is required", http.StatusBadRequest)
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

	collection, err := services.DeleteCollection(collectionID, userID, db)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	hub := middleware.GetEventsHub(r.Context())
	if hub == nil {
		log.Println("events hub not found")
		return
	}

	const EventKey = "collections:delete"
	hub.Publish(userID, events.Event{
		Type: EventKey,
		Data: models.EventData{
			ID: collectionID,
		},
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(collection); err != nil {
		http.Error(
			w,
			"failed to encode response",
			http.StatusInternalServerError,
		)
	}
}
