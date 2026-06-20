package models

import (
	"time"

	"github.com/google/uuid"
)

type Inbox struct {
	UserID       int64     `gorm:"primaryKey"`
	AttachmentID uuid.UUID `gorm:"type:uuid;primaryKey"`
	CreatedAt    time.Time `gorm:"default:now()" json:"created_at"`
}

type NewInbox struct {
	UserID       int64     `gorm:"primaryKey"`
	AttachmentID uuid.UUID `gorm:"type:uuid;primaryKey"`
}

type InboxItem struct {
	UserID       int64     `gorm:"primaryKey" json:"user_id"`
	AttachmentID uuid.UUID `gorm:"type:uuid;primaryKey" json:"attachment_id"`

	Attachment AttachmentWithTags `gorm:"foreignKey:AttachmentID;references:ID;constraint:OnDelete:CASCADE" json:"attachment"`

	CreatedAt time.Time `gorm:"default:now()" json:"created_at"`
}

func (InboxItem) TableName() string {
	return "inbox_items"
}
