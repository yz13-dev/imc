package repositories

import (
	"log"

	"github.com/yz13-dev/imc/api/internal/models"
	"gorm.io/gorm"
)

func CreateCardAttachment(data *models.NewCardAttachment, db *gorm.DB) (models.CardAttachment, error) {
	log.Println("card-attachment", data)
	cardAttachment := models.CardAttachment{
		AttachmentID: data.AttachmentID,
		CardID:       data.CardID,
	}

	if err := db.Table("cards_attachments").Create(&cardAttachment).Error; err != nil {
		return models.CardAttachment{}, err
	}
	return cardAttachment, nil
}
