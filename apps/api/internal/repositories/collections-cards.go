package repositories

import (
	"github.com/yz13-dev/imc/api/internal/models"
	"gorm.io/gorm"
)

func GetCollectionCards(collectionID string, db *gorm.DB) ([]models.CollectionCard, error) {
	var collectionCards []models.CollectionCard

	// join with cards table
	if err := db.Where("collection_id = ?", collectionID).Find(&collectionCards).Error; err != nil {
		return nil, err
	}
	return collectionCards, nil
}
