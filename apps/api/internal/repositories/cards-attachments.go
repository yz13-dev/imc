package repositories

import (
	"github.com/yz13-dev/imc/api/internal/models"
	"gorm.io/gorm"
)

func CreateCardAttachment(data *models.NewCardAttachment, db *gorm.DB) (models.CardAttachment, error) {
	cardAttachment := models.CardAttachment{
		AttachmentID: data.AttachmentID,
		CollectionID: data.CollectionID,
	}

	if err := db.Table("card_attachments").Create(&cardAttachment).Error; err != nil {
		return models.CardAttachment{}, err
	}
	return cardAttachment, nil
}
