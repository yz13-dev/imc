package models

import "time"

type Card struct {
	ID          string    `gorm:"primaryKey"`
	UserID      int64     `json:"user_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	CreatedAt   time.Time `gorm:"default:now()" json:"created_at"`
	UpdatedAt   time.Time `gorm:"default:now()" json:"updated_at"`
}

type NewCard struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	UserID      int64  `json:"user_id"`
}
