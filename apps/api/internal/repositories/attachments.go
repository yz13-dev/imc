package repositories

import (
	"log"

	"github.com/yz13-dev/imc/api/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func GetAttachments(UserID int64, db *gorm.DB) ([]models.Attachment, error) {
	var attachments []models.Attachment
	if err := db.Where("user_id = ?", UserID).Find(&attachments).Error; err != nil {
		return nil, err
	}
	return attachments, nil
}

func GetInboxAttachments(UserID int64, db *gorm.DB) ([]models.AttachmentWithTags, error) {
	var attachments []models.AttachmentWithTags
	if err := db.
		Table("attachments").
		Preload("AttachmentTags.Tag").
		Where("user_id = ? AND card_id IS NULL", UserID).
		Order(clause.OrderByColumn{Desc: true, Column: clause.Column{Name: "created_at"}}).
		Find(&attachments).Error; err != nil {
		return nil, err
	}
	return attachments, nil
}

func PostNewAttachment(UserID int64, db *gorm.DB, data models.NewAttachment) (models.Attachment, error) {
	log.Println("card", data.CardID)
	attachment := models.Attachment{
		CardID:     data.CardID,
		Type:       data.Type,
		MimeType:   data.MimeType,
		Src:        data.Src,
		Width:      data.Width,
		Height:     data.Height,
		DurationMS: data.DurationMS,
		FileSize:   data.FileSize,
		IsCover:    data.IsCover,
		Blurhash:   data.Blurhash,
		CreatedAt:  data.CreatedAt,
		UserID:     UserID,
	}

	if err := db.Table("attachments").Create(&attachment).Error; err != nil {
		return models.Attachment{}, err
	}
	return attachment, nil
}

func GetAttachment(UserID int64, attachmentID string, db *gorm.DB) (models.AttachmentWithTags, error) {
	var attachment models.AttachmentWithTags
	if err := db.
		Table("attachments").
		Preload("AttachmentTags.Tag").
		Preload("AttachmentSource.Source").
		Where("user_id = ? AND id = ?", UserID, attachmentID).
		First(&attachment).Error; err != nil {
		return models.AttachmentWithTags{}, err
	}
	return attachment, nil
}
