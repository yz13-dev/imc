package models

import "time"

type User struct {
	ID              int64  `gorm:"primaryKey"`
	Email           string `gorm:"unique"`
	Password        string
	EmailVerifiedAt time.Time `gorm:"type:timestamptz"`
	FirstName       string
	LastName        string
	CreatedAt       time.Time `gorm:"type:timestamptz"`
	UpdatedAt       time.Time `gorm:"type:timestamptz"`
	Username        string
}
