package models

import "time"

type CollectionCard struct {
	CollectionID string `gorm:"primaryKey"`
	CardID       string `gorm:"primaryKey"`
	SortOrder    int
	CreatedAt    time.Time
}
