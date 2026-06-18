package services

import (
	"github.com/yz13-dev/imc/api/internal/models"
	"github.com/yz13-dev/imc/api/internal/repositories"
	"gorm.io/gorm"
)

func GetInboxAttachments(UserID int64, db *gorm.DB) ([]models.Attachment, error) {
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

func GetAttachment(UserID int64, attachmentID string, db *gorm.DB) (models.Attachment, error) {
	attachment, err := repositories.GetAttachment(UserID, attachmentID, db)
	if err != nil {
		return models.Attachment{}, err
	}
	return attachment, nil
}
