package repositories

import (
	"errors"

	"github.com/google/uuid"
	"github.com/yz13-dev/imc/api/internal/models"
	"gorm.io/gorm"
)

func NewSource(data models.NewSource, db *gorm.DB) (*models.Source, error) {
	source := &models.Source{
		Slug:       data.Slug,
		Name:       data.Name,
		Domain:     data.Domain,
		FaviconURL: data.FaviconURL,
	}
	if err := db.Table("sources").Create(&source).Error; err != nil {
		return &models.Source{}, err
	}
	return source, nil
}

func GetSourceCheck(domain string, slug string, db *gorm.DB) (*models.SourceCheck, error) {
	var source models.Source

	err := db.
		Table("sources").
		Where("domain = ? AND slug = ?", domain, slug).
		First(&source).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return &models.SourceCheck{
			Exist: false,
			ID:    nil,
		}, nil
	}

	if err != nil {
		return nil, err
	}

	return &models.SourceCheck{
		Exist: true,
		ID:    &source.ID,
	}, nil
}

func CreateSourceConnectionToAttachment(attachmentID, sourceID uuid.UUID, db *gorm.DB) (*models.AttachmentSource, error) {
	attachmentSource := &models.AttachmentSource{
		AttachmentID: attachmentID,
		SourceID:     sourceID,
	}
	if err := db.Table("attachments_sources").Create(&attachmentSource).Error; err != nil {
		return &models.AttachmentSource{}, err
	}
	return attachmentSource, nil
}
