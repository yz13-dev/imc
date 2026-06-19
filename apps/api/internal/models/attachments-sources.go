package models

import (
	"time"

	"github.com/google/uuid"
)

type AttachmentSource struct {
	ID           uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	AttachmentID uuid.UUID `gorm:"not null" json:"attachment_id"`
	SourceID     uuid.UUID `gorm:"not null" json:"source_id"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`

	Source Source `gorm:"foreignKey:SourceID;references:ID" json:"domain"`
}

func (AttachmentSource) TableName() string {
	return "attachments_sources"
}
