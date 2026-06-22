package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"slices"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
	"github.com/thecodearcher/limen"
	gormadapter "github.com/thecodearcher/limen/adapters/gorm"
	config "github.com/yz13-dev/imc/api"
	"github.com/yz13-dev/imc/api/internal/events"
	"github.com/yz13-dev/imc/api/internal/handlers"
	internalMiddleware "github.com/yz13-dev/imc/api/internal/middleware"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type HealthResponse struct {
	Status    string `json:"status"`
	Timestamp string `json:"timestamp"`
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal(err)
	}

	// Initialise auth
	dsn := os.Getenv("DATABASE_URL")
	gormdb, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}

	adapter := gormadapter.New(gormdb)

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	auth, err := limen.New(config.NewAuthConfig(adapter))
	if err != nil {
		log.Fatalf("Failed to create limen: %v", err)
	}

	handler := auth.Handler()
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

			// 2. Разрешаем расширение Chrome (для POST/PUT запросов из WXT dev server)
			if strings.HasPrefix(origin, "chrome-extension://") {
				return true
			}
			if strings.HasPrefix(origin, "moz-extension://") {
				return true
			}

			// 3. Проверяем ваши стандартные локальные и продакшн домены
			allowed := []string{
				"https://imc.yz13.dev",
				"http://localhost:3000",
				"http://localhost:5173",
			}
			if slices.Contains(allowed, origin) {
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
	r.Handle("/auth/*", handler)

	r.Group(func(r chi.Router) {
		hub := events.NewHub()
		r.Use(internalMiddleware.DBInstance(gormdb))
		r.Use(internalMiddleware.UserInstance(auth))
		r.Use(internalMiddleware.EventsHubMiddleware(hub))

		r.Route("/v1", func(r chi.Router) {
			r.Get("/source/check", handlers.GetCheckSource)
			r.Post("/source/{sourceID}/connect", handlers.PostConnectSource)
			r.Post("/source/new", handlers.PostNewSource)
			// my routes
			r.Route("/my", func(r chi.Router) {
				r.Get("/events", handlers.EventsHandler(hub))
				r.Get("/attachments/inbox", handlers.GetInboxAttachments)
				r.Post("/attachments/inbox", handlers.PostInInbox)
				r.Post("/attachments/new", handlers.PostNewAttachment)
				r.Get("/attachments/{attachmentID}", handlers.GetAttachment)
				r.Get("/attachments/{attachmentID}/file", handlers.GetAttachmentFile)
				r.Get("/cards", handlers.GetMyCardsHandler)
				r.Get("/collections", handlers.GetMyCollectionsHandler)
				r.Post("/collections/new", handlers.PostMyNewCollectionHandler)
				r.Get("/collections/{collectionID}/cards", handlers.GetMyCollectionCards)
				r.Get("/collections/{collectionID}/attachments", handlers.GetCollectionAttachments)
				// move attachment to collection ?
				r.Post("/collections/{collectionID}/attachments", handlers.PostCollectionAttachments)
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
	http.ListenAndServeTLS(":"+port, "cert.pem", "key.pem", r)
}
