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
