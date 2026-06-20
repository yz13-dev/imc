package models

import (
	"time"

	"github.com/google/uuid"
)

type Attachment struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Type       string    `json:"type"`
	MimeType   string    `json:"mime_type"`
	Src        string    `json:"src"`
	Width      int       `json:"width"`
	Height     int       `json:"height"`
	DurationMS int       `json:"duration_ms"`
	FileSize   int64     `json:"file_size"`
	IsCover    bool      `json:"is_cover"`
	Blurhash   string    `json:"blurhash"`
	CreatedAt  time.Time `gorm:"default:now()" json:"created_at"`
	UserID     int64     `json:"user_id"`
	Label      string    `json:"label"`
}

type AttachmentWithTags struct {
	Attachment
	AttachmentTags   []AttachmentTag   `gorm:"foreignKey:AttachmentID" json:"tags"`
	AttachmentSource *AttachmentSource `gorm:"foreignKey:AttachmentID;references:ID" json:"source"`
}

type NewAttachment struct {
	Type       string
	MimeType   string
	Src        string
	Width      int
	Height     int
	DurationMS int
	FileSize   int64
	IsCover    bool
	Blurhash   string
	CreatedAt  time.Time `gorm:"default:now()"`
	UserID     int64
	Label      string
}
