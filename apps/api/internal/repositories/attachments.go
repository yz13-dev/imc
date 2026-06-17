package repositories

import (
	"github.com/yz13-dev/imc/api/internal/models"
	"gorm.io/gorm"
)

func GetAttachments(UserID int64, db *gorm.DB) ([]models.Attachment, error) {
	var attachments []models.Attachment
	if err := db.Where("user_id = ?", UserID).Find(&attachments).Error; err != nil {
		return nil, err
	}
	return attachments, nil
}

func GetInboxAttachments(UserID int64, db *gorm.DB) ([]models.Attachment, error) {
	var attachments []models.Attachment
	if err := db.Where("user_id = ? AND card_id IS NULL", UserID).Find(&attachments).Error; err != nil {
		return nil, err
	}
	return attachments, nil
}
