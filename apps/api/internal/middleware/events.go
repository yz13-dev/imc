package middleware

import (
	"context"
	"net/http"

	"github.com/yz13-dev/imc/api/internal/events"
)

type contextKey string

const EventsHubKey contextKey = "events_hub"

func EventsHubMiddleware(hub *events.Hub) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), EventsHubKey, hub)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetEventsHub(ctx context.Context) *events.Hub {
	hub, ok := ctx.Value(EventsHubKey).(*events.Hub)
	if !ok {
		return nil
	}
	return hub
}
