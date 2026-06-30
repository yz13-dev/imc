package services

import (
	"github.com/google/uuid"
	"github.com/yz13-dev/imc/api/internal/models"
	"github.com/yz13-dev/imc/api/internal/repositories"
	"gorm.io/gorm"
)

func GetInboxAttachments(UserID string, db *gorm.DB) ([]models.InboxItem, error) {
	attachments, err := repositories.GetInboxAttachments(UserID, db)
	if err != nil {
		return nil, err
	}
	return attachments, nil
}

func PostNewAttachment(UserID string, db *gorm.DB, data models.NewAttachment) (models.Attachment, error) {
	attachment, err := repositories.PostNewAttachment(UserID, db, data)
	if err != nil {
		return models.Attachment{}, err
	}
	return attachment, nil
}

func GetAttachment(UserID string, attachmentID string, db *gorm.DB) (models.AttachmentWithTags, error) {
	attachment, err := repositories.GetAttachment(UserID, attachmentID, db)
	if err != nil {
		return models.AttachmentWithTags{}, err
	}
	return attachment, nil
}

func GetPublicAttachment(attachmentID uuid.UUID, db *gorm.DB) (*models.AttachmentWithTags, error) {
	attachment, err := repositories.GetPublicAttachment(attachmentID, db)
	if err != nil {
		return nil, err
	}
	return attachment, nil
}

func PatchAttachment(AttachmentID uuid.UUID, UserID string, data models.UpdateAttachment, db *gorm.DB) (models.Attachment, error) {
	attachment, err := repositories.PatchAttachment(AttachmentID, UserID, data, db)
	if err != nil {
		return models.Attachment{}, err
	}
	return attachment, nil
}

func PostInInbox(UserID string, db *gorm.DB, attachmentID uuid.UUID) error {
	err := repositories.PostInInbox(UserID, db, attachmentID)
	if err != nil {
		return err
	}
	return nil
}

func GetCollectionAttachments(collectionID uuid.UUID, UserID string, db *gorm.DB) ([]models.AttachmentWithTags, error) {
	attachments, err := repositories.GetCollectionAttachments(collectionID, UserID, db)
	if err != nil {
		return nil, err
	}
	return attachments, nil
}

func GetAllAttachments(UserID string, query repositories.ListQuery, db *gorm.DB) ([]models.AttachmentWithTags, error) {
	attachments, err := repositories.GetAllAttachments(UserID, query, db)
	if err != nil {
		return nil, err
	}
	return attachments, nil
}

func TrashAttachment(UserID string, attachmentID string, db *gorm.DB) error {
	err := repositories.TrashAttachment(UserID, attachmentID, db)
	if err != nil {
		return err
	}
	return nil
}

func UntrashAttachment(UserID string, attachmentID string, db *gorm.DB) error {
	err := repositories.UntrashAttachment(UserID, attachmentID, db)
	if err != nil {
		return err
	}
	return nil
}

func DeleteAttachment(UserID string, attachmentID string, db *gorm.DB) (models.Attachment, error) {
	attachment, err := repositories.DeleteAttachment(UserID, attachmentID, db)
	if err != nil {
		return models.Attachment{}, err
	}
	return attachment, nil
}

func GetTrashAttachments(UserID string, db *gorm.DB) ([]models.AttachmentWithTags, error) {
	attachments, err := repositories.GetTrashAttachments(UserID, db)
	if err != nil {
		return nil, err
	}
	return attachments, nil
}

func GetAttachmentWithCollection(ID uuid.UUID, db *gorm.DB) (*models.CollectionAttachmentWithAttachmentAndAttachment, error) {
	attachment, err := repositories.GetAttachmentWithCollection(ID, db)
	if err != nil {
		return nil, err
	}
	return attachment, nil
}
