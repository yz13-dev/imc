package models

import "time"

type Card struct {
	ID          string `gorm:"primaryKey"`
	UserID      int64
	Title       string
	Description string
	SourceID    string
	SourceURL   string
	SourceLabel string
	IsFavorite  bool
	IsArchived  bool
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
