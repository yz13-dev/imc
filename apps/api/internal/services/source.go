package services

import (
	"github.com/google/uuid"
	"github.com/yz13-dev/imc/api/internal/models"
	"github.com/yz13-dev/imc/api/internal/repositories"
	"gorm.io/gorm"
)

func NewSource(data models.NewSource, db *gorm.DB) (*models.Source, error) {
	source, err := repositories.NewSource(data, db)
	if err != nil {
		return nil, err
	}
	return source, nil
}

func GetCheckSource(domain string, slug string, db *gorm.DB) (*models.SourceCheck, error) {
	source, err := repositories.GetSourceCheck(domain, slug, db)
	if err != nil {
		return source, err
	}
	return source, nil
}

func PostConnectSource(attachmentID, sourceID uuid.UUID, db *gorm.DB) (*models.AttachmentSource, error) {
	attachmentSource, err := repositories.CreateSourceConnectionToAttachment(attachmentID, sourceID, db)
	if err != nil {
		return nil, err
	}
	return attachmentSource, nil
}
