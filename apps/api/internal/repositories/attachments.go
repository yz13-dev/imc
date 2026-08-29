package repositories

import (
	"errors"

	"github.com/google/uuid"
	"github.com/yz13-dev/imc/api/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func GetAttachments(UserID string, db *gorm.DB) ([]models.Attachment, error) {
	var attachments []models.Attachment
	if err := db.Where("user_id = ? AND is_deleted = false", UserID).Find(&attachments).Error; err != nil {
		return nil, err
	}
	return attachments, nil
}

// attachCollectionIDs batch-fetches collections_attachments for the given
// attachments (one query, not N+1) and fills in each Attachment.CollectionIDs.
// Authenticated repo functions only — never call this from the Get*Public*
// functions, since an attachment's collection_ids can include collections the
// requester has no access to.
func attachCollectionIDs(attachments []models.AttachmentWithTags, db *gorm.DB) error {
	if len(attachments) == 0 {
		return nil
	}
	ids := make([]uuid.UUID, len(attachments))
	for i, attachment := range attachments {
		ids[i] = attachment.ID
	}
	var links []models.CollectionAttachment
	if err := db.Table("collections_attachments").Where("attachment_id IN ?", ids).Find(&links).Error; err != nil {
		return err
	}
	byAttachment := make(map[uuid.UUID][]uuid.UUID, len(ids))
	for _, link := range links {
		byAttachment[link.AttachmentID] = append(byAttachment[link.AttachmentID], link.CollectionID)
	}
	for i := range attachments {
		collectionIDs := byAttachment[attachments[i].ID]
		if collectionIDs == nil {
			collectionIDs = []uuid.UUID{}
		}
		attachments[i].CollectionIDs = collectionIDs
	}
	return nil
}

// filterByTagNames restricts a base attachments query to rows connected to
// every one of the given tag names (AND semantics). No-op when tagNames is
// empty.
func filterByTagNames(db *gorm.DB, userID string, tagNames []string) *gorm.DB {
	if len(tagNames) == 0 {
		return db
	}
	sub := db.Session(&gorm.Session{NewDB: true}).
		Table("attachments_tags").
		Select("attachments_tags.attachment_id").
		Joins("JOIN tags ON tags.id = attachments_tags.tag_id").
		Where("tags.user_id = ? AND tags.name IN ?", userID, tagNames).
		Group("attachments_tags.attachment_id").
		Having("COUNT(DISTINCT tags.name) = ?", len(tagNames))
	return db.Where("attachments.id IN (?)", sub)
}

func GetAttachmentsWithTags(ids []uuid.UUID, UserID string, tagNames []string, db *gorm.DB) ([]models.AttachmentWithTags, error) {
	var attachments []models.AttachmentWithTags
	query := db.
		Table("attachments").
		Preload("AttachmentTags.Tag").
		Preload("AttachmentSource.Source").
		Where("user_id = ? AND id IN ? AND is_deleted = false", UserID, ids)
	query = filterByTagNames(query, UserID, tagNames)
	if err := query.
		Order(clause.OrderByColumn{Desc: true, Column: clause.Column{Name: "created_at"}}).
		Find(&attachments).Error; err != nil {
		return nil, err
	}
	if err := attachCollectionIDs(attachments, db); err != nil {
		return nil, err
	}
	return attachments, nil
}

func GetPublicAttachmentsWithTags(ids []uuid.UUID, db *gorm.DB) ([]models.AttachmentWithTags, error) {
	var attachments []models.AttachmentWithTags
	if err := db.
		Table("attachments").
		Preload("AttachmentTags.Tag").
		Preload("AttachmentSource.Source").
		Where("attachments.id IN ? AND attachments.is_deleted = false", ids).
		Where("(attachments.public = true OR EXISTS (SELECT 1 FROM collections_attachments ca JOIN collections c ON c.id = ca.collection_id WHERE ca.attachment_id = attachments.id AND c.public = true))").
		Order(clause.OrderByColumn{Desc: true, Column: clause.Column{Name: "created_at"}}).
		Find(&attachments).Error; err != nil {
		return nil, err
	}
	return attachments, nil
}

func GetAttachmentWithInboxCheck(attachmentID uuid.UUID, UserID string, db *gorm.DB) (models.AttachmentWithInbox, error) {
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

func GetCollectionAttachments(collectionID uuid.UUID, UserID string, listQuery ListQuery, db *gorm.DB) ([]models.AttachmentWithTags, error) {
	var attachments []models.AttachmentWithTags
	query := db.
		Table("attachments").
		Distinct("attachments.*").
		Joins("JOIN collections_attachments ON collections_attachments.attachment_id = attachments.id").
		Preload("AttachmentTags.Tag").
		Preload("AttachmentSource.Source").
		Where("collections_attachments.collection_id = ? AND attachments.user_id = ? AND attachments.is_deleted = false", collectionID, UserID)
	query = filterByTagNames(query, UserID, listQuery.Tags)
	query = applyCursor(query, listQuery.Cursor, "attachments", "id")
	if err := query.
		Order(clause.OrderByColumn{Desc: true, Column: clause.Column{Table: "attachments", Name: "created_at"}}).
		Order(clause.OrderByColumn{Desc: true, Column: clause.Column{Table: "attachments", Name: "id"}}).
		Limit(listQuery.Limit).
		Find(&attachments).Error; err != nil {
		return nil, err
	}
	if err := attachCollectionIDs(attachments, db); err != nil {
		return nil, err
	}
	return attachments, nil
}

func GetPublicCollectionAttachments(collectionID uuid.UUID, listQuery ListQuery, db *gorm.DB) ([]models.AttachmentWithTags, error) {

	colleciton, err := GetPublicCollection(collectionID, db)
	if err != nil {
		return nil, err
	}

	if colleciton.Public == false {
		return nil, err
	}

	var attachments []models.AttachmentWithTags
	q := db.
		Table("attachments").
		Distinct("attachments.*").
		Joins("JOIN collections_attachments ON collections_attachments.attachment_id = attachments.id").
		Preload("AttachmentTags.Tag").
		Preload("AttachmentSource.Source").
		Where("collections_attachments.collection_id = ? AND attachments.is_deleted = false", collectionID)
	q = applyCursor(q, listQuery.Cursor, "attachments", "id")
	if err := q.
		Order(clause.OrderByColumn{Desc: true, Column: clause.Column{Table: "attachments", Name: "created_at"}}).
		Order(clause.OrderByColumn{Desc: true, Column: clause.Column{Table: "attachments", Name: "id"}}).
		Limit(listQuery.Limit).
		Find(&attachments).Error; err != nil {
		return nil, err
	}
	return attachments, nil

}

func PostNewAttachment(UserID string, db *gorm.DB, data models.NewAttachment) (models.Attachment, error) {
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

func PatchAttachment(AttachmentID uuid.UUID, UserID string, data models.UpdateAttachment, db *gorm.DB) (models.Attachment, error) {
	updates := map[string]any{}
	if data.Label != nil {
		updates["label"] = *data.Label
	}
	if data.Public != nil {
		updates["public"] = *data.Public
	}
	if err := db.Table("attachments").Where("id = ? AND user_id = ?", AttachmentID, UserID).Updates(updates).Error; err != nil {
		return models.Attachment{}, err
	}
	updated, err := GetAttachment(UserID, AttachmentID.String(), db)
	if err != nil {
		return models.Attachment{}, err
	}
	return updated.Attachment, nil
}

func GetAttachment(UserID string, attachmentID string, db *gorm.DB) (models.AttachmentWithTags, error) {
	var attachment models.AttachmentWithTags
	if err := db.
		Table("attachments").
		Preload("AttachmentTags.Tag").
		Preload("AttachmentSource.Source").
		Where("user_id = ? AND id = ? AND is_deleted = false", UserID, attachmentID).
		First(&attachment).Error; err != nil {
		return models.AttachmentWithTags{}, err
	}
	wrapped := []models.AttachmentWithTags{attachment}
	if err := attachCollectionIDs(wrapped, db); err != nil {
		return models.AttachmentWithTags{}, err
	}
	return wrapped[0], nil
}

func GetPublicAttachment(attachmentID uuid.UUID, db *gorm.DB) (*models.AttachmentWithTags, error) {
	var attachment models.AttachmentWithTags
	if err := db.
		Table("attachments").
		Preload("AttachmentTags.Tag").
		Preload("AttachmentSource.Source").
		Where("attachments.id = ? AND attachments.is_deleted = false", attachmentID).
		Where("(attachments.public = true OR EXISTS (SELECT 1 FROM collections_attachments ca JOIN collections c ON c.id = ca.collection_id WHERE ca.attachment_id = attachments.id AND c.public = true))").
		First(&attachment).Error; err != nil {
		return nil, err
	}
	return &attachment, nil
}

// GetPublicAttachmentFile loads only the fields needed to authorize and serve
// an asset. Asset requests can be far more frequent than detail-page reads, so
// they must not preload tags or source metadata.
func GetPublicAttachmentFile(attachmentID uuid.UUID, db *gorm.DB) (models.Attachment, error) {
	var attachment models.Attachment
	if err := db.
		Table("attachments").
		Where("attachments.id = ? AND attachments.is_deleted = false", attachmentID).
		Where("(attachments.public = true OR EXISTS (SELECT 1 FROM collections_attachments ca JOIN collections c ON c.id = ca.collection_id WHERE ca.attachment_id = attachments.id AND c.public = true))").
		First(&attachment).Error; err != nil {
		return models.Attachment{}, err
	}
	return attachment, nil
}

// GetPrivateAttachmentFile loads only the file metadata when the requester
// owns either the attachment itself or a collection containing it.
func GetPrivateAttachmentFile(attachmentID uuid.UUID, userID string, db *gorm.DB) (models.Attachment, error) {
	var attachment models.Attachment
	if err := db.
		Table("attachments").
		Where("attachments.id = ? AND attachments.is_deleted = false", attachmentID).
		Where("attachments.user_id = ? OR EXISTS (SELECT 1 FROM collections_attachments ca JOIN collections c ON c.id = ca.collection_id WHERE ca.attachment_id = attachments.id AND c.user_id = ?)", userID, userID).
		First(&attachment).Error; err != nil {
		return models.Attachment{}, err
	}
	return attachment, nil
}

type ListQuery struct {
	Cursor *Cursor
	Limit  int
	Tags   []string
}

// applyCursor restricts a query already ordered by created_at DESC, idColumn
// DESC to rows strictly after the given cursor position. idColumn is the
// tie-breaker column for rows sharing the same created_at value — usually
// "id", but "attachment_id" for tables keyed that way (e.g. inbox_items).
func applyCursor(db *gorm.DB, cursor *Cursor, table string, idColumn string) *gorm.DB {
	if cursor == nil {
		return db
	}
	createdAtCol := "created_at"
	idCol := idColumn
	if table != "" {
		createdAtCol = table + ".created_at"
		idCol = table + "." + idColumn
	}
	return db.Where("("+createdAtCol+", "+idCol+") < (?, ?)", cursor.CreatedAt, cursor.ID)
}

func GetAllAttachments(UserID string, query ListQuery, db *gorm.DB) ([]models.AttachmentWithTags, error) {
	var attachments []models.AttachmentWithTags
	q := db.
		Table("attachments").
		Preload("AttachmentTags.Tag").
		Preload("AttachmentSource.Source").
		Where("user_id = ? AND is_deleted = false", UserID)
	q = filterByTagNames(q, UserID, query.Tags)
	q = applyCursor(q, query.Cursor, "", "id")
	if err := q.
		Order("created_at DESC, id DESC").
		Limit(query.Limit).
		Find(&attachments).Error; err != nil {
		return nil, err
	}
	if err := attachCollectionIDs(attachments, db); err != nil {
		return nil, err
	}
	return attachments, nil
}

func TrashAttachment(UserID string, attachmentID string, db *gorm.DB) error {
	if err := db.Table("attachments").Where("user_id = ? AND id = ?", UserID, attachmentID).Update("is_deleted", true).Error; err != nil {
		return err
	}
	return nil
}

func UntrashAttachment(UserID string, attachmentID string, db *gorm.DB) error {
	if err := db.Table("attachments").Where("user_id = ? AND id = ?", UserID, attachmentID).Update("is_deleted", false).Error; err != nil {
		return err
	}
	return nil
}

func DeleteAttachment(UserID string, attachmentID string, db *gorm.DB) (models.Attachment, error) {
	var attachment models.Attachment

	if err := db.
		Where("user_id = ? AND id = ?", UserID, attachmentID).
		First(&attachment).Error; err != nil {
		return models.Attachment{}, err
	}

	if err := db.Delete(&attachment).Error; err != nil {
		return models.Attachment{}, err
	}

	return attachment, nil
}

func GetTrashAttachments(UserID string, query ListQuery, db *gorm.DB) ([]models.AttachmentWithTags, error) {
	var attachments []models.AttachmentWithTags
	q := db.
		Table("attachments").
		Preload("AttachmentTags.Tag").
		Preload("AttachmentSource.Source").
		Where("user_id = ? AND is_deleted = true", UserID)
	q = applyCursor(q, query.Cursor, "", "id")
	if err := q.
		Order("created_at DESC, id DESC").
		Limit(query.Limit).
		Find(&attachments).Error; err != nil {
		return nil, err
	}
	if err := attachCollectionIDs(attachments, db); err != nil {
		return nil, err
	}
	return attachments, nil
}

func GetAttachmentWithCollection(ID uuid.UUID, db *gorm.DB) (*models.CollectionAttachmentWithAttachmentAndAttachment, error) {
	var result models.CollectionAttachmentWithAttachmentAndAttachment

	err := db.
		Table("collections_attachments").
		Preload("Attachment").
		Preload("Collection").
		Where("attachment_id = ?", ID).
		First(&result).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}

	if err != nil {
		return nil, err
	}

	return &result, nil

}
