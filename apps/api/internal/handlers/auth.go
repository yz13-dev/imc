package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/yz13-dev/imc/api/internal/middleware"
)

func GetMe(w http.ResponseWriter, r *http.Request) {

	user, ok := middleware.GetUser(r.Context())

	log.Println("[USER]", ok)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(user); err != nil {
		http.Error(
			w,
			"failed to encode response",
			http.StatusInternalServerError,
		)
	}
}
