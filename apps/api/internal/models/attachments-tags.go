package models

import (
	"time"

	"github.com/google/uuid"
)

type AttachmentTag struct {
	ID           uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	AttachmentID uuid.UUID `gorm:"not null" json:"attachment_id"`
	TagID        uuid.UUID `gorm:"not null" json:"tag_id"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`

	Tag Tag `gorm:"foreignKey:TagID;references:ID" json:"tag"`
}

func (AttachmentTag) TableName() string {
	return "attachments_tags"
}

type NewAttachmentTag struct {
	AttachmentID uuid.UUID
	TagID        uuid.UUID
}
