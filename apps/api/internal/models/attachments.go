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
	UserID     string    `json:"user_id"`
	Label      string    `json:"label"`
	IsDeleted  bool      `gorm:"default:false" json:"is_deleted"`
	Public     bool      `gorm:"default:false" json:"public"`

	Description   *string    `json:"description"`
	AIStatus      string     `gorm:"column:ai_status;default:pending" json:"ai_status"`
	AIProcessedAt *time.Time `gorm:"column:ai_processed_at" json:"ai_processed_at"`
	AIAttempts    int        `gorm:"column:ai_attempts;default:0" json:"ai_attempts"`
	// Not a real column — populated after the fact from collections_attachments
	// (many-to-many, see migrations/15_collections_attachments.up.sql). Only
	// set on authenticated (/my/...) responses, never on public ones, since it
	// can reveal collections the requester isn't authorized to know about.
	CollectionIDs []uuid.UUID `gorm:"-" json:"collection_ids"`
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
	UserID     string    `json:"user_id"`
	Label      string
}

type UpdateAttachment struct {
	Label  *string `json:"label"`
	Public *bool   `json:"public"`
}

type AttachmentWithInbox struct {
	Attachment `json:"attachment"`
	Inbox      *Inbox `gorm:"foreignKey:AttachmentID;references:ID" json:"inbox"`
}
