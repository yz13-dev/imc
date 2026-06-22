package services

import (
	"github.com/google/uuid"
	"github.com/yz13-dev/imc/api/internal/models"
	"github.com/yz13-dev/imc/api/internal/repositories"
	"gorm.io/gorm"
)

func GetAttachmentWithInboxCheck(attachmentID uuid.UUID, UserID int64, db *gorm.DB) (models.AttachmentWithInbox, error) {
	return repositories.GetAttachmentWithInboxCheck(attachmentID, UserID, db)
}

func DeleteFromAttachmentInbox(attachmentID uuid.UUID, UserID int64, db *gorm.DB) error {
	return repositories.DeleteInboxItem(attachmentID, UserID, db)
}
