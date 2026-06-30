package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

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

		ch := hub.Subscribe(userID)
		defer hub.Unsubscribe(userID, ch)

		ctx := r.Context()

		for {
			select {
			case <-ctx.Done():
				return

			case event := <-ch:
				data, _ := json.Marshal(event.Data)

				fmt.Fprintf(w, "event: %s\n", event.Type)
				fmt.Fprintf(w, "data: %s\n\n", data)

				flusher.Flush()
			}
		}
	}
}
