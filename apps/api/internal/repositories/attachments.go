package repositories

import (
	"github.com/google/uuid"
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

func GetAttachmentsWithTags(ids []uuid.UUID, UserID int64, db *gorm.DB) ([]models.AttachmentWithTags, error) {
	var attachments []models.AttachmentWithTags
	if err := db.
		Table("attachments").
		Preload("AttachmentTags.Tag").
		Preload("AttachmentSource.Source").
		Where("user_id = ? AND id IN ?", UserID, ids).
		Order(clause.OrderByColumn{Desc: true, Column: clause.Column{Name: "created_at"}}).
		Find(&attachments).Error; err != nil {
		return nil, err
	}
	return attachments, nil
}

func GetInboxAttachments(UserID int64, db *gorm.DB) ([]models.InboxItem, error) {
	var inboxes []models.Inbox
	if err := db.Table("inbox_items").Where("user_id = ?", UserID).Find(&inboxes).Error; err != nil {
		return nil, err
	}

	if len(inboxes) == 0 {
		return []models.InboxItem{}, nil
	}

	ids := make([]uuid.UUID, len(inboxes))
	for i, inbox := range inboxes {
		ids[i] = inbox.AttachmentID
	}

	attachments, err := GetAttachmentsWithTags(ids, UserID, db)
	if err != nil {
		return nil, err
	}

	attachmentsMap := make(map[uuid.UUID]models.AttachmentWithTags, len(attachments))
	for _, attachment := range attachments {
		attachmentsMap[attachment.ID] = attachment
	}

	items := make([]models.InboxItem, 0, len(inboxes))
	for _, inbox := range inboxes {
		attachment, ok := attachmentsMap[inbox.AttachmentID]
		if !ok {
			continue
		}

		items = append(items, models.InboxItem{
			AttachmentID: inbox.AttachmentID,
			UserID:       UserID,
			Attachment:   attachment,
			CreatedAt:    inbox.CreatedAt,
		})
	}

	return items, nil
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
		Where("user_id = ? AND id = ?", UserID, attachmentID).
		First(&attachment).Error; err != nil {
		return models.AttachmentWithTags{}, err
	}
	return attachment, nil
}

func PostInInbox(UserID int64, db *gorm.DB, attachmentID uuid.UUID) error {
	inbox := models.NewInbox{
		UserID:       UserID,
		AttachmentID: attachmentID,
	}
	if err := db.Table("inbox_items").Create(&inbox).Error; err != nil {
		return err
	}
	return nil
}
