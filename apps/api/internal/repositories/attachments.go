package repositories

import (
	"github.com/google/uuid"
	"github.com/yz13-dev/imc/api/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func GetAttachments(UserID int64, db *gorm.DB) ([]models.Attachment, error) {
	var attachments []models.Attachment
	if err := db.Where("user_id = ? AND is_deleted = false", UserID).Find(&attachments).Error; err != nil {
		return nil, err
	}
	return attachments, nil
}

func GetAttachmentsWithTags(ids []uuid.UUID, UserID int64, db *gorm.DB) ([]models.AttachmentWithTags, error) {
	var attachments []models.AttachmentWithTags
	if err := db.
		Table("attachments").
		Preload("AttachmentTags.Tag").
		Preload("AttachmentSource.Source").
		Where("user_id = ? AND id IN ? AND is_deleted = false", UserID, ids).
		Order(clause.OrderByColumn{Desc: true, Column: clause.Column{Name: "created_at"}}).
		Find(&attachments).Error; err != nil {
		return nil, err
	}
	return attachments, nil
}

func GetAttachmentWithInboxCheck(attachmentID uuid.UUID, UserID int64, db *gorm.DB) (models.AttachmentWithInbox, error) {
	var inbox models.Inbox
	var attachment models.Attachment

	if err := db.Table("inbox_items").Where("attachment_id = ? AND user_id = ?", attachmentID, UserID).First(&inbox).Error; err != nil {
		return models.AttachmentWithInbox{}, nil
	}

	if err := db.Table("attachments").Where("id = ? AND user_id = ? AND is_deleted = false", attachmentID, UserID).First(&attachment).Error; err != nil {
		return models.AttachmentWithInbox{}, err
	}

	return models.AttachmentWithInbox{
		Attachment: attachment,
		Inbox:      &inbox,
	}, nil
}

func GetCollectionAttachments(collectionID uuid.UUID, UserID int64, db *gorm.DB) ([]models.AttachmentWithTags, error) {
	var collectionAttachments []models.CollectionAttachment
	if err := db.
		Table("collections_attachments").
		Where("collection_id = ?", collectionID).
		Find(&collectionAttachments).Error; err != nil {
		return nil, err
	}

	if len(collectionAttachments) == 0 {
		return []models.AttachmentWithTags{}, nil
	}

	ids := make([]uuid.UUID, len(collectionAttachments))
	for i, attachment := range collectionAttachments {
		ids[i] = attachment.AttachmentID
	}

	attachments, err := GetAttachmentsWithTags(ids, UserID, db)
	if err != nil {
		return nil, err
	}

	return attachments, nil

}

func PostNewAttachment(UserID int64, db *gorm.DB, data models.NewAttachment) (models.Attachment, error) {
	attachment := models.Attachment{
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
		Where("user_id = ? AND id = ? AND is_deleted = false", UserID, attachmentID).
		First(&attachment).Error; err != nil {
		return models.AttachmentWithTags{}, err
	}
	return attachment, nil
}

type ListQuery struct {
	Offset int
	Limit  int
}

func GetAllAttachments(UserID int64, query ListQuery, db *gorm.DB) ([]models.AttachmentWithTags, error) {
	var attachments []models.AttachmentWithTags
	if err := db.
		Table("attachments").
		Preload("AttachmentTags.Tag").
		Preload("AttachmentSource.Source").
		Where("user_id = ? AND is_deleted = false", UserID).
		Order("created_at DESC").
		Offset(query.Offset).
		Limit(query.Limit).
		Find(&attachments).Error; err != nil {
		return nil, err
	}
	return attachments, nil
}

func TrashAttachment(UserID int64, attachmentID string, db *gorm.DB) error {
	if err := db.Table("attachments").Where("user_id = ? AND id = ?", UserID, attachmentID).Update("is_deleted", true).Error; err != nil {
		return err
	}
	return nil
}

func UntrashAttachment(UserID int64, attachmentID string, db *gorm.DB) error {
	if err := db.Table("attachments").Where("user_id = ? AND id = ?", UserID, attachmentID).Update("is_deleted", false).Error; err != nil {
		return err
	}
	return nil
}

func DeleteAttachment(userID int64, attachmentID string, db *gorm.DB) (models.Attachment, error) {
	var attachment models.Attachment

	if err := db.
		Where("user_id = ? AND id = ?", userID, attachmentID).
		First(&attachment).Error; err != nil {
		return models.Attachment{}, err
	}

	if err := db.Delete(&attachment).Error; err != nil {
		return models.Attachment{}, err
	}

	return attachment, nil
}

func GetTrashAttachments(UserID int64, db *gorm.DB) ([]models.AttachmentWithTags, error) {
	var attachments []models.AttachmentWithTags
	if err := db.
		Table("attachments").
		Preload("AttachmentTags.Tag").
		Preload("AttachmentSource.Source").
		Where("user_id = ? AND is_deleted = true", UserID).
		Find(&attachments).Error; err != nil {
		return nil, err
	}
	return attachments, nil
}
