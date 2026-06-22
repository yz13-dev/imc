package models

import "github.com/google/uuid"

type CollectionAttachment struct {
	ID           string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CollectionID string    `json:"collection_id"`
	AttachmentID uuid.UUID `json:"attachment_id"`
}

type CollectionAttachmentWithAttachment struct {
	CollectionAttachment
	Attachment Attachment `gorm:"foreignKey:AttachmentID" json:"attachment"`
}
