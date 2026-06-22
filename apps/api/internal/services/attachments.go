package services

import (
	"github.com/google/uuid"
	"github.com/yz13-dev/imc/api/internal/models"
	"github.com/yz13-dev/imc/api/internal/repositories"
	"gorm.io/gorm"
)

func GetInboxAttachments(UserID int64, db *gorm.DB) ([]models.InboxItem, error) {
	attachments, err := repositories.GetInboxAttachments(UserID, db)
	if err != nil {
		return nil, err
	}
	return attachments, nil
}

func PostNewAttachment(UserID int64, db *gorm.DB, data models.NewAttachment) (models.Attachment, error) {
	attachment, err := repositories.PostNewAttachment(UserID, db, data)
	if err != nil {
		return models.Attachment{}, err
	}
	return attachment, nil
}

func GetAttachment(UserID int64, attachmentID string, db *gorm.DB) (models.AttachmentWithTags, error) {
	attachment, err := repositories.GetAttachment(UserID, attachmentID, db)
	if err != nil {
		return models.AttachmentWithTags{}, err
	}
	return attachment, nil
}

func PostInInbox(UserID int64, db *gorm.DB, attachmentID uuid.UUID) error {
	err := repositories.PostInInbox(UserID, db, attachmentID)
	if err != nil {
		return err
	}
	return nil
}

func GetCollectionAttachments(collectionID uuid.UUID, UserID int64, db *gorm.DB) ([]models.AttachmentWithTags, error) {
	attachments, err := repositories.GetCollectionAttachments(collectionID, UserID, db)
	if err != nil {
		return nil, err
	}
	return attachments, nil
}

func GetAllAttachments(UserID int64, db *gorm.DB) ([]models.AttachmentWithTags, error) {
	attachments, err := repositories.GetAllAttachments(UserID, db)
	if err != nil {
		return nil, err
	}
	return attachments, nil
}
