package repositories

import (
	"github.com/google/uuid"
	"github.com/yz13-dev/imc/api/internal/models"
	"gorm.io/gorm"
)

func CreateNewTag(data models.NewTag, db *gorm.DB) (*models.Tag, error) {
	tag := models.Tag{
		UserID: data.UserID,
		Name:   data.Name,
	}
	if err := db.Create(&tag).Error; err != nil {
		return nil, err
	}
	return &tag, nil
}

func SearchTags(query string, UserID int64, db *gorm.DB) ([]models.Tag, error) {
	var tags []models.Tag
	if err := db.Table("tags").Where("user_id = ? AND name LIKE ?", UserID, "%"+query+"%").Find(&tags).Error; err != nil {
		return nil, err
	}
	return tags, nil
}

func ConnectTagToAttachment(tagID uuid.UUID, attachmentID uuid.UUID, db *gorm.DB) error {
	var attachmentTag models.NewAttachmentTag = models.NewAttachmentTag{
		AttachmentID: attachmentID,
		TagID:        tagID,
	}
	if err := db.Table("attachments_tags").Create(&attachmentTag).Error; err != nil {
		return err
	}
	return nil
}
