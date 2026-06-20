package events

import "sync"

type Event struct {
	Type string `json:"type"`
	Data any    `json:"data"`
}

type Hub struct {
	mu      sync.RWMutex
	clients map[int64]map[chan Event]struct{}
}

func NewHub() *Hub {
	return &Hub{
		clients: make(map[int64]map[chan Event]struct{}),
	}
}
