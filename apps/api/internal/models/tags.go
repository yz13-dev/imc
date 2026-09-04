package models

import (
	"time"

	"github.com/google/uuid"
)

type Tag struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    string    `gorm:"not null" json:"user_id"`
	Name      string    `gorm:"not null" json:"name"`
	CreatedAt time.Time `gorm:"default: now()" json:"created_at"`
}

type NewTag struct {
	Name   string `json:"name"`
	UserID string `json:"user_id"`
}

type TagWithCount struct {
	Tag
	Count int64 `json:"count"`
}

type PublicTagWithCount struct {
	ID    uuid.UUID `json:"id"`
	Name  string    `json:"name"`
	Count int64     `json:"count"`
}
