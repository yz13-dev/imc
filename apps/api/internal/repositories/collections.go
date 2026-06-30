package repositories

import (
	"github.com/google/uuid"
	"github.com/yz13-dev/imc/api/internal/models"
	"gorm.io/gorm"
)

func GetCollections(UserID string, db *gorm.DB) ([]models.Collection, error) {
	var collections []models.Collection
	if err := db.Where("user_id = ?", UserID).Find(&collections).Error; err != nil {
		return nil, err
	}
	return collections, nil
}

func NewCollection(data *models.NewCollection, db *gorm.DB) (*models.Collection, error) {
	collection := &models.Collection{
		Name:        data.Name,
		Description: data.Description,
		UserID:      data.UserID,
		Public:      data.Public,
	}

	created := db.Create(&collection)
	if created.Error != nil {
		return nil, created.Error
	}
	return collection, nil
}

func GetCollection(collectionID string, UserID string, db *gorm.DB) (*models.Collection, error) {
	var collection models.Collection
	if err := db.Where("id = ? AND user_id = ?", collectionID, UserID).First(&collection).Error; err != nil {
		return nil, err
	}
	return &collection, nil
}

func GetPublicCollection(collectionID uuid.UUID, db *gorm.DB) (*models.Collection, error) {
	var collection models.Collection
	if err := db.Where("id = ? AND public = true", collectionID).First(&collection).Error; err != nil {
		return nil, err
	}
	return &collection, nil
}

func NewCollectionAttachment(collectionID uuid.UUID, attachmentID uuid.UUID, db *gorm.DB) (*models.CollectionAttachment, error) {
	var attachment models.CollectionAttachment = models.CollectionAttachment{
		CollectionID: collectionID,
		AttachmentID: attachmentID,
	}
	if err := db.Table("collections_attachments").Create(&attachment).Error; err != nil {
		return nil, err
	}
	return &attachment, nil
}

func DeleteCollection(collectionID string, UserID string, db *gorm.DB) (*models.Collection, error) {
	var collection models.Collection

	if err := db.
		Table("collections").
		Where("id = ? AND user_id = ?", collectionID, UserID).
		First(&collection).
		Error; err != nil {
		return nil, err
	}

	if err := db.
		Table("collections").
		Where("id = ? AND user_id = ?", collectionID, UserID).
		Delete(&collection).Error; err != nil {
		return nil, err
	}
	return &collection, nil
}
