package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/yz13-dev/imc/api/internal/middleware"
	"github.com/yz13-dev/imc/api/internal/models"
	"github.com/yz13-dev/imc/api/internal/services"
)

// func(w http.ResponseWriter, r *http.Request)
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
