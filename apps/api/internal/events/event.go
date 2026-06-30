package events

func (h *Hub) Subscribe(UserID string) chan Event {
	ch := make(chan Event, 10)

	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.clients[UserID]; !ok {
		h.clients[UserID] = make(map[chan Event]struct{})
	}

	h.clients[UserID][ch] = struct{}{}

	return ch
}
func (h *Hub) Unsubscribe(UserID string, ch chan Event) {
	h.mu.Lock()
	defer h.mu.Unlock()

	delete(h.clients[UserID], ch)

	if len(h.clients[UserID]) == 0 {
		delete(h.clients, UserID)
	}

	close(ch)
}
func (h *Hub) Publish(UserID string, event Event) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for ch := range h.clients[UserID] {
		select {
		case ch <- event:
		default:
			// клиент медленный, пропускаем событие
		}
	}
}
