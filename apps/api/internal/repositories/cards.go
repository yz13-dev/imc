package repositories

import (
	"github.com/yz13-dev/imc/api/internal/models"
	"gorm.io/gorm"
)

func GetCards(UserID int64, db *gorm.DB) ([]models.Card, error) {
	var cards []models.Card
	err := db.Find(&cards, "user_id = ?", UserID).Error
	return cards, err
}

func CreateCard(UserID int64, data *models.NewCard, db *gorm.DB) (models.Card, error) {
	var card = models.Card{
		UserID:      UserID,
		Title:       data.Title,
		Description: data.Description,
	}
	if err := db.Table("cards").Create(&card).Error; err != nil {
		return models.Card{}, err
	}
	return card, nil
}
