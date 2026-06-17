package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/yz13-dev/imc/api/internal/middleware"
	"github.com/yz13-dev/imc/api/internal/repositories"
)

func GetMyCollectionCards(w http.ResponseWriter, r *http.Request) {

	_, ok := middleware.GetUser(r.Context())
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}

	collectionID := r.PathValue("collectionID")

	db, ok := middleware.GetDB(r.Context())
	if !ok {
		http.Error(w, "database not found", http.StatusInternalServerError)
		return
	}

	collectionCards, err := repositories.GetCollectionCards(collectionID, db)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err := json.NewEncoder(w).Encode(collectionCards); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
