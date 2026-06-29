package services

import (
	"github.com/google/uuid"
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

func CreateCollection(data *models.NewCollection, db *gorm.DB) (*models.Collection, error) {
	collection, err := repositories.NewCollection(data, db)
	if err != nil {
		return nil, err
	}
	return collection, nil
}

func GetCollection(collectionID string, userID int64, db *gorm.DB) (*models.Collection, error) {
	collection, err := repositories.GetCollection(collectionID, userID, db)
	if err != nil {
		return nil, err
	}
	return collection, nil
}

func GetPublicCollectionAttachments(collectionID uuid.UUID, db *gorm.DB) ([]models.AttachmentWithTags, error) {
	attachments, err := repositories.GetPublicCollectionAttachments(collectionID, db)
	if err != nil {
		return nil, err
	}
	return attachments, nil
}

func CreateCollectionAttachment(collectionID uuid.UUID, attachmentID uuid.UUID, db *gorm.DB) (*models.CollectionAttachment, error) {
	attachment, err := repositories.NewCollectionAttachment(collectionID, attachmentID, db)
	if err != nil {
		return nil, err
	}
	return attachment, nil
}

func DeleteCollection(collectionID string, userID int64, db *gorm.DB) (*models.Collection, error) {
	collection, err := repositories.DeleteCollection(collectionID, userID, db)
	if err != nil {
		return nil, err
	}
	return collection, nil
}
