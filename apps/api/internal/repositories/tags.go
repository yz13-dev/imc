package repositories

import (
	"github.com/google/uuid"
	"github.com/yz13-dev/imc/api/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func CreateNewTag(data models.NewTag, db *gorm.DB) (*models.Tag, error) {
	tag := models.Tag{
		UserID: data.UserID,
		Name:   data.Name,
	}
	if err := db.Create(&tag).Error; err != nil {
		return nil, err
	}
	return &tag, nil
}

// FindOrCreateTag returns the user's existing tag with this name, creating
// it first if needed. Safe to call repeatedly for the same (userID, name)
// pair — e.g. from the AI worker, where generated tags routinely repeat
// across attachments.
func FindOrCreateTag(name string, userID string, db *gorm.DB) (*models.Tag, error) {
	tag := models.Tag{UserID: userID, Name: name}
	if err := db.Where(models.Tag{UserID: userID, Name: name}).FirstOrCreate(&tag).Error; err != nil {
		return nil, err
	}
	return &tag, nil
}

func SearchTags(query string, UserID string, db *gorm.DB) ([]models.Tag, error) {
	var tags []models.Tag
	if err := db.Table("tags").Where("user_id = ? AND name LIKE ?", UserID, "%"+query+"%").Find(&tags).Error; err != nil {
		return nil, err
	}
	return tags, nil
}

// ListGlobalTagNames returns a bounded vocabulary of the most commonly used
// tag names. Only names are returned — no user IDs, counts, or relationships.
func ListGlobalTagNames(limit int, db *gorm.DB) ([]string, error) {
	if limit <= 0 {
		return []string{}, nil
	}

	var names []string
	if err := db.Table("tags").
		Select("name").
		Group("name").
		Order("COUNT(*) DESC").
		Order("name ASC").
		Limit(limit).
		Pluck("name", &names).Error; err != nil {
		return nil, err
	}
	return names, nil
}

// GetTagsWithCounts returns every tag the user has actually used (INNER
// JOINs, so a tag with zero matching attachments is excluded), along with
// how many non-deleted attachments carry it. When collectionID is set, the
// count is scoped to just that collection's attachments.
func GetTagsWithCounts(userID string, collectionID *uuid.UUID, db *gorm.DB) ([]models.TagWithCount, error) {
	q := db.Table("tags").
		Select("tags.*, COUNT(DISTINCT attachments_tags.attachment_id) AS count").
		Joins("JOIN attachments_tags ON attachments_tags.tag_id = tags.id").
		Joins("JOIN attachments ON attachments.id = attachments_tags.attachment_id AND attachments.is_deleted = false").
		Where("tags.user_id = ?", userID)
	if collectionID != nil {
		q = q.Joins("JOIN collections_attachments ON collections_attachments.attachment_id = attachments.id AND collections_attachments.collection_id = ?", *collectionID)
	}
	var results []models.TagWithCount
	if err := q.Group("tags.id").Order("count DESC").Order("tags.name ASC").Scan(&results).Error; err != nil {
		return nil, err
	}
	return results, nil
}

func ConnectTagToAttachment(tagID uuid.UUID, attachmentID uuid.UUID, db *gorm.DB) error {
	var attachmentTag models.NewAttachmentTag = models.NewAttachmentTag{
		AttachmentID: attachmentID,
		TagID:        tagID,
	}
	// DoNothing on conflict: the (attachment_id, tag_id) pair may already be
	// linked (e.g. the AI worker retrying a previously partially-processed
	// attachment) — that's not an error, just a no-op.
	if err := db.Table("attachments_tags").
		Clauses(clause.OnConflict{DoNothing: true}).
		Create(&attachmentTag).Error; err != nil {
		return err
	}
	return nil
}

func DisconnectTagFromAttachment(tagID uuid.UUID, attachmentID uuid.UUID, db *gorm.DB) error {
	if err := db.Table("attachments_tags").Where("tag_id = ? AND attachment_id = ?", tagID, attachmentID).Delete(&models.NewAttachmentTag{}).Error; err != nil {
		return err
	}
	return nil
}
