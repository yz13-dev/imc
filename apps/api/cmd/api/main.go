package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
	"github.com/thecodearcher/limen"
	gormadapter "github.com/thecodearcher/limen/adapters/gorm"
	config "github.com/yz13-dev/imc/api"
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
	// r.Use(func(next http.Handler) http.Handler {
	// 	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	// 		origin := r.Header.Get("Origin")

	// 		if origin == "http://localhost:3000" {
	// 			w.Header().Set("Access-Control-Allow-Origin", origin)
	// 			w.Header().Set("Access-Control-Allow-Credentials", "true")
	// 			w.Header().Set(
	// 				"Access-Control-Allow-Headers",
	// 				"Content-Type, Authorization",
	// 			)
	// 			w.Header().Set(
	// 				"Access-Control-Allow-Methods",
	// 				"GET, POST, PUT, PATCH, DELETE, OPTIONS",
	// 			)
	// 		}

	// 		// Ответ на preflight
	// 		if r.Method == http.MethodOptions {
	// 			w.WriteHeader(http.StatusNoContent)
	// 			return
	// 		}

	// 		next.ServeHTTP(w, r)
	// 	})
	// })
	r.Use(cors.Handler(cors.Options{
		// AllowedOrigins:   []string{"https://foo.com"}, // Use this to allow specific origin hosts
		AllowedOrigins: []string{"https://imc.yz13.dev", "http://localhost:3000"},
		// AllowOriginFunc:  func(r *http.Request, origin string) bool { return true },
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300, // Maximum value not ignored by any of major browsers
	}))
	r.Handle("/auth/*", handler)

	r.Group(func(r chi.Router) {
		r.Use(internalMiddleware.DBInstance(gormdb))
		r.Use(internalMiddleware.UserInstance(auth))

		// my routes
		r.Route("/v1/my/", func(r chi.Router) {
			r.Get("/attachments", handlers.GetMyCardsHandler)
			r.Get("/cards", handlers.GetMyCardsHandler)
			r.Get("/collections", handlers.GetMyCollectionsHandler)
			r.Get("/collections/{collectionID}/cards", handlers.GetMyCollectionCards)
		})
		// public routes
		r.Route("/v1/{user}/", func(r chi.Router) {

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
	http.ListenAndServe(":"+port, r)
}
