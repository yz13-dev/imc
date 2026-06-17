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
