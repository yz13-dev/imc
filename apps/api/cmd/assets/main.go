package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
	"github.com/yz13-dev/imc/api/internal/events"
	"github.com/yz13-dev/imc/api/internal/handlers"
	internalMiddleware "github.com/yz13-dev/imc/api/internal/middleware"
	"github.com/yz13-dev/imc/api/internal/utils"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type HealthResponse struct {
	Status    string `json:"status"`
	Timestamp string `json:"timestamp"`
}

// POSTGRES_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
//
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

func main() {
	if os.Getenv("APP_ENV") != "production" {
		_ = godotenv.Load()
	}

	// Initialise auth
	gormdb, err := gorm.Open(postgres.Open(GetDSN()), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Use(cors.Handler(cors.Options{
		Debug: true,
		// AllowedOrigins:   []string{"https://foo.com"}, // Use this to allow specific origin hosts
		// AllowedOrigins: []string{"https://imc.yz13.dev", "http://localhost:3000", "http://localhost:5173"},
		AllowOriginFunc: func(r *http.Request, origin string) bool {
			log.Println("origin:", origin)
			// 1. Разрешаем пустой Origin (нужно для GET-запросов из background скрипта)
			if origin == "" {
				return true
			}

			allowed := utils.GetOrigins()
			if utils.MatchOrigin(allowed, origin) {
				return true
			}

			// Все остальные запросы блокируются
			return false
		},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300, // Maximum value not ignored by any of major browsers
	}))

	r.Group(func(r chi.Router) {
		hub := events.NewHub()
		r.Use(internalMiddleware.DBInstance(gormdb))
		r.Use(internalMiddleware.UserInstance())
		r.Use(internalMiddleware.EventsHubMiddleware(hub))

		r.Route("/v1", func(r chi.Router) {
			r.Get("/attachments/{attachmentID}/file", handlers.GetAttachmentFile)
		})
	})

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		timestamp := time.Now()

		response := HealthResponse{
			Status:    "ok",
			Timestamp: timestamp.Format(time.RFC3339),
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)

		if err := json.NewEncoder(w).Encode(response); err != nil {
			http.Error(
				w,
				"failed to encode response",
				http.StatusInternalServerError,
			)
		}
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
	}
	log.Println("listening on port", port)

	if os.Getenv("APP_ENV") != "production" {
		http.ListenAndServeTLS(":"+port, "cert.pem", "key.pem", r)
	} else {
		http.ListenAndServe(":"+port, r)
	}
}
