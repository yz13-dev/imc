package models

import "time"

type Card struct {
	ID          string    `gorm:"primaryKey"`
	UserID      int64     `json:"user_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	SourceID    string    `json:"source_id"`
	CreatedAt   time.Time `gorm:"default:now()" json:"created_at"`
	UpdatedAt   time.Time `gorm:"default:now()" json:"updated_at"`
}

type NewCard struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	SourceID    string `json:"source_id"`
	UserID      int64  `json:"user_id"`
}
