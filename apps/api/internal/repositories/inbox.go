package repositories

import (
	"github.com/google/uuid"
	"github.com/yz13-dev/imc/api/internal/models"
	"gorm.io/gorm"
)

func PostInInbox(UserID string, db *gorm.DB, attachmentID uuid.UUID) error {
	inbox := models.NewInbox{
		UserID:       UserID,
		AttachmentID: attachmentID,
	}
	if err := db.Table("inbox_items").Create(&inbox).Error; err != nil {
		return err
	}
	return nil
}

func GetInboxAttachments(UserID string, listQuery ListQuery, db *gorm.DB) ([]models.InboxItem, error) {
	var items []models.InboxItem
	query := db.
		Table("inbox_items").
		Select("inbox_items.*").
		Joins("JOIN attachments ON attachments.id = inbox_items.attachment_id").
		Preload("Attachment.AttachmentTags.Tag").
		Preload("Attachment.AttachmentSource.Source").
		Where("inbox_items.user_id = ? AND attachments.user_id = ? AND attachments.is_deleted = false", UserID, UserID)
	q := filterByTagNames(query, UserID, listQuery.Tags)
	q = applyCursor(q, listQuery.Cursor, "inbox_items", "attachment_id")
	if err := q.
		Order("inbox_items.created_at DESC, inbox_items.attachment_id DESC").
		Limit(listQuery.Limit).
		Find(&items).Error; err != nil {
		return nil, err
	}

	attachments := make([]models.AttachmentWithTags, len(items))
	for i := range items {
		attachments[i] = items[i].Attachment
	}
	if err := attachCollectionIDs(attachments, db); err != nil {
		return nil, err
	}
	for i := range items {
		items[i].Attachment = attachments[i]
	}

	return items, nil
}

func DeleteInboxItem(inboxItemID uuid.UUID, UserID string, db *gorm.DB) error {
	var inboxItem models.Inbox
	if err := db.Table("inbox_items").Where("attachment_id = ? AND user_id = ?", inboxItemID, UserID).First(&inboxItem).Error; err != nil {
		return err
	}
	if err := db.Table("inbox_items").Delete(&inboxItem).Error; err != nil {
		return err
	}
	return nil
}
