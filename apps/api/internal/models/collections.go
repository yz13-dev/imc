package models

import "github.com/google/uuid"

type Collection struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   string    `gorm:"default:now()" json:"created_at"`
	UpdatedAt   string    `gorm:"default:now()" json:"updated_at"`
	UserID      string    `json:"user_id"`
	Public      bool      `gorm:"default:false" json:"public"`
}

type NewCollection struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	UserID      string `json:"user_id"`
	Public      bool   `json:"public"`
}

type UpdateCollection struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Public      *bool  `json:"public"`
}

// PublicCollection contains only metadata that is safe to expose without an
// authenticated user session.
type PublicCollection struct {
	ID              uuid.UUID `json:"id"`
	Name            string    `json:"name"`
	Description     string    `json:"description"`
	UpdatedAt       string    `json:"updated_at"`
	AttachmentCount int64     `json:"attachment_count"`
}
