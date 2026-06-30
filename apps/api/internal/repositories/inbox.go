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

func GetInboxAttachments(UserID string, db *gorm.DB) ([]models.InboxItem, error) {
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
