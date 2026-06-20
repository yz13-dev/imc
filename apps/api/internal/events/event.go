package events

func (h *Hub) Subscribe(userID int64) chan Event {
	ch := make(chan Event, 10)

	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.clients[userID]; !ok {
		h.clients[userID] = make(map[chan Event]struct{})
	}

	h.clients[userID][ch] = struct{}{}

	return ch
}
func (h *Hub) Unsubscribe(userID int64, ch chan Event) {
	h.mu.Lock()
	defer h.mu.Unlock()

	delete(h.clients[userID], ch)

	if len(h.clients[userID]) == 0 {
		delete(h.clients, userID)
	}

	close(ch)
}
func (h *Hub) Publish(userID int64, event Event) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for ch := range h.clients[userID] {
		select {
		case ch <- event:
		default:
			// клиент медленный, пропускаем событие
		}
	}
}
