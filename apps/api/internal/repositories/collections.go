package repositories

import (
	"github.com/google/uuid"
	"github.com/yz13-dev/imc/api/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
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

func UpdateCollectionPublic(collectionID string, userID string, public bool, db *gorm.DB) (*models.Collection, error) {
	var collection models.Collection
	if err := db.Where("id = ? AND user_id = ?", collectionID, userID).First(&collection).Error; err != nil {
		return nil, err
	}
	if err := db.Model(&collection).Update("public", public).Error; err != nil {
		return nil, err
	}
	collection.Public = public
	return &collection, nil
}

func NewCollectionAttachment(collectionID uuid.UUID, attachmentID uuid.UUID, db *gorm.DB) (*models.CollectionAttachment, error) {
	var attachment models.CollectionAttachment = models.CollectionAttachment{
		CollectionID: collectionID,
		AttachmentID: attachmentID,
	}
	created := db.Table("collections_attachments").
		Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "collection_id"}, {Name: "attachment_id"}},
			DoNothing: true,
		}).
		Create(&attachment)
	if created.Error != nil {
		return nil, created.Error
	}
	if created.RowsAffected == 0 {
		if err := db.Table("collections_attachments").Where("collection_id = ? AND attachment_id = ?", collectionID, attachmentID).First(&attachment).Error; err != nil {
			return nil, err
		}
	}
	return &attachment, nil
}

// MoveAttachmentToCollection validates both resources belong to the user,
// removes the optional inbox row, and creates the collection link atomically.
// The bool result indicates whether an inbox item was removed.
func MoveAttachmentToCollection(collectionID, attachmentID uuid.UUID, userID string, db *gorm.DB) (*models.CollectionAttachment, bool, error) {
	var collectionAttachment models.CollectionAttachment
	var removedFromInbox bool
	err := db.Transaction(func(tx *gorm.DB) error {
		var collection models.Collection
		if err := tx.Where("id = ? AND user_id = ?", collectionID, userID).First(&collection).Error; err != nil {
			return err
		}
		var attachment models.Attachment
		if err := tx.Where("id = ? AND user_id = ? AND is_deleted = false", attachmentID, userID).First(&attachment).Error; err != nil {
			return err
		}

		deleted := tx.Table("inbox_items").Where("attachment_id = ? AND user_id = ?", attachmentID, userID).Delete(&models.Inbox{})
		if deleted.Error != nil {
			return deleted.Error
		}
		removedFromInbox = deleted.RowsAffected > 0

		created, err := NewCollectionAttachment(collectionID, attachmentID, tx)
		if err != nil {
			return err
		}
		collectionAttachment = *created
		return nil
	})
	if err != nil {
		return nil, false, err
	}
	return &collectionAttachment, removedFromInbox, nil
}

func DeleteCollectionAttachment(collectionID uuid.UUID, attachmentID uuid.UUID, db *gorm.DB) error {
	if err := db.
		Table("collections_attachments").
		Where("collection_id = ? AND attachment_id = ?", collectionID, attachmentID).
		Delete(&models.CollectionAttachment{}).Error; err != nil {
		return err
	}
	return nil
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
