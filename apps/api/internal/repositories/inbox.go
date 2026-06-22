package repositories

import (
	"github.com/google/uuid"
	"github.com/yz13-dev/imc/api/internal/models"
	"gorm.io/gorm"
)

func DeleteInboxItem(inboxItemID uuid.UUID, userID int64, db *gorm.DB) error {
	var inboxItem models.Inbox
	if err := db.Table("inbox_items").Where("attachment_id = ? AND user_id = ?", inboxItemID, userID).First(&inboxItem).Error; err != nil {
		return err
	}
	if err := db.Table("inbox_items").Delete(&inboxItem).Error; err != nil {
		return err
	}
	return nil
}
