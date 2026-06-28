package services

import (
	"github.com/yz13-dev/imc/api/internal/models"
	"github.com/yz13-dev/imc/api/internal/repositories"
	"gorm.io/gorm"
)

func CreateCardAttachment(data *models.NewCardAttachment, db *gorm.DB) (models.CardAttachment, error) {
	cardAttachment, err := repositories.CreateCardAttachment(data, db)
	if err != nil {
		return models.CardAttachment{}, err
	}
	return cardAttachment, nil
}
