package models

import "github.com/google/uuid"

type CardAttachment struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	AttachmentID uuid.UUID `gorm:"not null" json:"attachment_id"`
	CollectionID uuid.UUID `gorm:"not null" json:"collection_id"`
}

type NewCardAttachment struct {
	AttachmentID uuid.UUID `json:"attachment_id"`
	CollectionID uuid.UUID `json:"collection_id"`
}
