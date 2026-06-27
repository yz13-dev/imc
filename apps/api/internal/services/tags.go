package services

import (
	"github.com/google/uuid"
	"github.com/yz13-dev/imc/api/internal/models"
	"github.com/yz13-dev/imc/api/internal/repositories"
	"gorm.io/gorm"
)

func ConnectTagToAttachment(tagID uuid.UUID, attachmentID uuid.UUID, db *gorm.DB) error {
	if err := repositories.ConnectTagToAttachment(tagID, attachmentID, db); err != nil {
		return err
	}
	return nil
}

func DisconnectTagFromAttachment(tagID uuid.UUID, attachmentID uuid.UUID, db *gorm.DB) error {
	if err := repositories.DisconnectTagFromAttachment(tagID, attachmentID, db); err != nil {
		return err
	}
	return nil
}

func CreateTag(name string, userId int64, db *gorm.DB) (*models.Tag, error) {
	tag, err := repositories.CreateNewTag(models.NewTag{Name: name, UserID: userId}, db)
	if err != nil {
		return nil, err
	}
	return tag, nil
}

func SearchTags(query string, UserID int64, db *gorm.DB) ([]models.Tag, error) {
	tags, err := repositories.SearchTags(query, UserID, db)
	if err != nil {
		return nil, err
	}
	return tags, nil
}
