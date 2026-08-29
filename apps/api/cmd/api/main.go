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
// The monolithic DB (yz13-stage/yz13) holds every project's tables in its own
// Postgres schema rather than its own database, so every connection this
// binary opens sets search_path=imc via the options DSN param — pgx forwards
// it as a libpq startup parameter, applying it before any query runs. This
// only affects connections opened here; ad hoc `psql -f migrations/*.sql`
// runs still need PGOPTIONS="-c search_path=imc" set explicitly.
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
		// AllowedOrigins: []string{"https://imc.yz13.dev", "http://localhost:5173"},
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
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300, // Maximum value not ignored by any of major browsers
	}))
	r.Use(internalMiddleware.UserInstance())

	r.Get("/auth/me", handlers.GetMe)

	r.Group(func(r chi.Router) {
		hub := events.NewHub()
		r.Use(internalMiddleware.DBInstance(gormdb))
		r.Use(internalMiddleware.EventsHubMiddleware(hub))

		r.Route("/v1", func(r chi.Router) {
			r.Get("/source/check", handlers.GetCheckSource)
			r.Post("/source/{sourceID}/connect", handlers.PostConnectSource)
			r.Post("/source/new", handlers.PostNewSource)

			r.Get("/collections/{collectionID}/attachments", handlers.GetPublicCollectionAttachments)
			r.Get("/attachments/{attachmentID}", handlers.GetPublicAttachment)
			// my routes
			r.Route("/my", func(r chi.Router) {
				r.Get("/events", handlers.EventsHandler(hub))
				// tags
				r.Get("/tags", handlers.GetMyTags)
				r.Get("/tags/search", handlers.GetTagsSearch)
				r.Post("/tags/new", handlers.PostNewTag)
				// attachments
				r.Get("/attachments", handlers.GetAllAttachments)
				r.Get("/attachments/inbox", handlers.GetInboxAttachments)
				r.Post("/attachments/inbox", handlers.PostInInbox)
				r.Post("/attachments/new", handlers.PostNewAttachment)
				r.Get("/attachments/trash", handlers.GetTrashAttachments)
				r.Get("/attachments/{attachmentID}", handlers.GetAttachment)
				r.Patch("/attachments/{attachmentID}", handlers.PatchAttachment)
				r.Delete("/attachments/{attachmentID}", handlers.DeleteAttachment)
				r.Post("/attachments/{attachmentID}/cards", handlers.CreateCardAttachment)
				r.Post("/attachments/{attachmentID}/trash", handlers.TrashAttachment)
				r.Post("/attachments/{attachmentID}/untrash", handlers.UnTrashAttachment)
				r.Post("/attachments/{attachmentID}/tags", handlers.PostConnectAttachmentTag)
				r.Delete("/attachments/{attachmentID}/tags", handlers.DeleteDisconnectAttachmentTag)
				r.Get("/attachments/{attachmentID}/file", handlers.GetAttachmentFile)
				// card
				r.Get("/cards", handlers.GetMyCardsHandler)
				r.Post("/cards", handlers.PostNewCard)
				// collections
				r.Get("/collections", handlers.GetMyCollectionsHandler)
				r.Post("/collections/new", handlers.PostMyNewCollectionHandler)
				r.Get("/collections/{collectionID}/cards", handlers.GetMyCollectionCards)
				// r.Post("/collections/{collectionID}/cards", handlers.CreateCardAttachment)
				r.Get("/collections/{collectionID}/attachments", handlers.GetCollectionAttachments)
				r.Delete("/collections/{collectionID}", handlers.DeleteCollectionHandler)
				// move attachment to collection ?
				r.Post("/collections/{collectionID}/attachments", handlers.PostCollectionAttachments)
				r.Delete("/collections/{collectionID}/attachments", handlers.DeleteCollectionAttachments)
				// move card to collection ?
				r.Post("/collections/{collectionID}/cards", handlers.GetMyCollectionCards)
			})
			//
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
		port = "8080"
	}
	log.Println("listening on port", port)

	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal(err)
	}
}
