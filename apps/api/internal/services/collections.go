package services

import (
	"github.com/google/uuid"
	"github.com/yz13-dev/imc/api/internal/models"
	"github.com/yz13-dev/imc/api/internal/repositories"
	"gorm.io/gorm"
)

func GetCollections(UserID string, db *gorm.DB) ([]models.Collection, error) {
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

func GetCollection(collectionID string, UserID string, db *gorm.DB) (*models.Collection, error) {
	collection, err := repositories.GetCollection(collectionID, UserID, db)
	if err != nil {
		return nil, err
	}
	return collection, nil
}

func UpdateCollectionPublic(collectionID string, userID string, public bool, db *gorm.DB) (*models.Collection, error) {
	return repositories.UpdateCollectionPublic(collectionID, userID, public, db)
}

func GetPublicCollectionAttachments(collectionID uuid.UUID, query repositories.ListQuery, db *gorm.DB) ([]models.AttachmentWithTags, error) {
	attachments, err := repositories.GetPublicCollectionAttachments(collectionID, query, db)
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

func DeleteCollectionAttachment(collectionID uuid.UUID, attachmentID uuid.UUID, db *gorm.DB) error {
	if err := repositories.DeleteCollectionAttachment(collectionID, attachmentID, db); err != nil {
		return err
	}
	return nil
}

func DeleteCollection(collectionID string, UserID string, db *gorm.DB) (*models.Collection, error) {
	collection, err := repositories.DeleteCollection(collectionID, UserID, db)
	if err != nil {
		return nil, err
	}
	return collection, nil
}
