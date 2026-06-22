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

func GetMyCollectionsHandler(w http.ResponseWriter, r *http.Request) {
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

	userID := user.ID.(int64) // as uint64

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
	data.UserID = int(userID)

	collection, err := services.CreateCollection(&data, db)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

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

	userID := user.ID.(int64) // as uint64

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

	attachment, err := services.GetAttachmentWithInboxCheck(attachmentId, userID, db)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if attachment.Inbox != nil {
		log.Println("Need to remove from inbox before move to collection")
		if err := services.DeleteFromAttachmentInbox(attachmentId, userID, db); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		hub := middleware.GetEventsHub(r.Context())
		if hub == nil {
			log.Println("events hub not found")
			return
		}

		const InboxEventKey = "inbox:remove"
		hub.Publish(userID, events.Event{
			Type: InboxEventKey,
			Data: attachmentId,
		})
		const CollectionEventKey = "collection:update"
		hub.Publish(userID, events.Event{
			Type: CollectionEventKey,
			Data: collection.ID,
		})
	}

	collectionAttachment, err := services.CreateCollectionAttachment(collection.ID, attachmentId, db)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
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
