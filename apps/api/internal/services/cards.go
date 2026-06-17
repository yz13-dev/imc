package services

import (
	"github.com/yz13-dev/imc/api/internal/models"
	"github.com/yz13-dev/imc/api/internal/repositories"
	"gorm.io/gorm"
)

func GetMyCards(UserID int64, db *gorm.DB) ([]models.Card, error) {
	cards, err := repositories.GetCards(UserID, db)
	if err != nil {
		return nil, err
	}
	return cards, nil
}
