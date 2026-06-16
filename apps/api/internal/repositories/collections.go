package repositories

import (
	"github.com/yz13-dev/imc/api/internal/models"
	"gorm.io/gorm"
)

func GetCollections(UserID int64, db *gorm.DB) ([]models.Collection, error) {
	var collections []models.Collection
	if err := db.Where("user_id = ?", UserID).Find(&collections).Error; err != nil {
		return nil, err
	}
	return collections, nil
}
