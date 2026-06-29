package models

import "github.com/google/uuid"

type CollectionAttachment struct {
	ID           string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CollectionID uuid.UUID `json:"collection_id"`
	AttachmentID uuid.UUID `json:"attachment_id"`
}

type CollectionAttachmentWithAttachment struct {
	CollectionAttachment
	Attachment Attachment `gorm:"foreignKey:AttachmentID;references:ID" json:"attachment"`
}

type CollectionAttachmentWithAttachmentAndAttachment struct {
	CollectionAttachmentWithAttachment
	Collection *Collection `gorm:"foreignKey:CollectionID;references:ID" json:"collection"`
}

func (CollectionAttachmentWithAttachmentAndAttachment) TableName() string {
	return "collections_attachments"
}
