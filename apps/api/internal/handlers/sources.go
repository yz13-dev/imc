package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
	"github.com/yz13-dev/imc/api/internal/middleware"
	"github.com/yz13-dev/imc/api/internal/models"
	"github.com/yz13-dev/imc/api/internal/services"
)

func PostNewSource(w http.ResponseWriter, r *http.Request) {

	_, ok := middleware.GetUser(r.Context())
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}

	var data models.NewSource
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, "failed to decode request", http.StatusBadRequest)
		return
	}
	// userID := user.ID.(int64) // as uint64

	db, ok := middleware.GetDB(r.Context())
	if !ok {
		http.Error(w, "database not found", http.StatusInternalServerError)
		return
	}

	source, err := services.NewSource(data, db)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(source); err != nil {
		http.Error(
			w,
			"failed to encode response",
			http.StatusInternalServerError,
		)
	}
}

func GetCheckSource(w http.ResponseWriter, r *http.Request) {

	Domain := r.URL.Query().Get("domain")
	Slug := r.URL.Query().Get("slug")

	_, ok := middleware.GetUser(r.Context())
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}

	db, ok := middleware.GetDB(r.Context())
	if !ok {
		http.Error(w, "database not found", http.StatusInternalServerError)
		return
	}

	source, err := services.GetCheckSource(Domain, Slug, db)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(source); err != nil {
		http.Error(
			w,
			"failed to encode response",
			http.StatusInternalServerError,
		)
	}
}

func PostConnectSource(w http.ResponseWriter, r *http.Request) {
	sourceID := r.PathValue("sourceID")
	attachmentID := r.URL.Query().Get("attachmentID")

	db, ok := middleware.GetDB(r.Context())
	if !ok {
		http.Error(w, "database not found", http.StatusInternalServerError)
		return
	}

	sourceUUID, err := uuid.Parse(sourceID)
	if err != nil {
		http.Error(w, "invalid source ID", http.StatusBadRequest)
		return
	}
	attachmentUUID, err := uuid.Parse(attachmentID)
	if err != nil {
		http.Error(w, "invalid attachment ID", http.StatusBadRequest)
		return
	}
	attachmentSource, err := services.PostConnectSource(attachmentUUID, sourceUUID, db)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(attachmentSource); err != nil {
		http.Error(
			w,
			"failed to encode response",
			http.StatusInternalServerError,
		)
	}
}
