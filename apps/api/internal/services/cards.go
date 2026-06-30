package services

import (
	"github.com/yz13-dev/imc/api/internal/models"
	"github.com/yz13-dev/imc/api/internal/repositories"
	"gorm.io/gorm"
)

func GetMyCards(UserID string, db *gorm.DB) ([]models.Card, error) {
	cards, err := repositories.GetCards(UserID, db)
	if err != nil {
		return nil, err
	}
	return cards, nil
}

func CreateCard(UserID string, data *models.NewCard, db *gorm.DB) (models.Card, error) {
	card, err := repositories.CreateCard(UserID, data, db)
	if err != nil {
		return models.Card{}, err
	}
	return card, nil
}
