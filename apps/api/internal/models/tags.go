package models

import (
	"time"

	"github.com/google/uuid"
)

type Tag struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    int64     `gorm:"not null" json:"user_id"`
	Name      string    `gorm:"not null" json:"name"`
	CreatedAt time.Time `gorm:"default: now()" json:"created_at"`
}

type NewTag struct {
	Name   string `json:"name"`
	UserID int64  `json:"user_id"`
}
