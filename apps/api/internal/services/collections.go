package services

import (
	"github.com/yz13-dev/imc/api/internal/models"
	"github.com/yz13-dev/imc/api/internal/repositories"
	"gorm.io/gorm"
)

func GetCollections(UserID int64, db *gorm.DB) ([]models.Collection, error) {
	collections, err := repositories.GetCollections(UserID, db)
	if err != nil {
		return nil, err
	}
	return collections, nil
}
