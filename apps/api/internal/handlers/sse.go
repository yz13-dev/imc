package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/yz13-dev/imc/api/internal/events"
	"github.com/yz13-dev/imc/api/internal/middleware"
)

func EventsHandler(hub *events.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		user, ok := middleware.GetUser(r.Context())
		if !ok {
			http.Error(w, "user not found", http.StatusUnauthorized)
			return
		}

		userID := user.ID

		flusher, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "Streaming unsupported", 500)
			return
		}

		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")
		w.Header().Set("X-Accel-Buffering", "no")

		ch := hub.Subscribe(userID)
		defer hub.Unsubscribe(userID, ch)

		ctx := r.Context()

		ticker := time.NewTicker(20 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return

			case <-ticker.C:
				if _, err := fmt.Fprintf(w, ": ping\n\n"); err != nil {
					return
				}
				flusher.Flush()

			case event := <-ch:
				data, _ := json.Marshal(event.Data)

				if _, err := fmt.Fprintf(w, "event: %s\n", event.Type); err != nil {
					return
				}
				fmt.Fprintf(w, "data: %s\n\n", data)

				flusher.Flush()
			}
		}
	}
}
