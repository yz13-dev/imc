package repositories

import (
	"time"

	"github.com/google/uuid"
	"github.com/yz13-dev/imc/api/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// ClaimPendingAttachments atomically grabs up to `limit` attachments still
// waiting on AI processing and flips them to 'processing' in the same
// transaction, using SKIP LOCKED so multiple worker instances never claim
// the same row twice.
func ClaimPendingAttachments(limit int, db *gorm.DB) ([]models.Attachment, error) {
	var claimed []models.Attachment
	err := db.Transaction(func(tx *gorm.DB) error {
		var pending []models.Attachment
		if err := tx.
			Clauses(clause.Locking{Strength: "UPDATE", Options: "SKIP LOCKED"}).
			Where("ai_status = ? AND is_deleted = false", "pending").
			Order("created_at ASC").
			Limit(limit).
			Find(&pending).Error; err != nil {
			return err
		}
		if len(pending) == 0 {
			return nil
		}
		ids := make([]uuid.UUID, len(pending))
		for i, a := range pending {
			ids[i] = a.ID
		}
		if err := tx.Model(&models.Attachment{}).
			Where("id IN ?", ids).
			Update("ai_status", "processing").Error; err != nil {
			return err
		}
		for i := range pending {
			pending[i].AIStatus = "processing"
		}
		claimed = pending
		return nil
	})
	if err != nil {
		return nil, err
	}
	return claimed, nil
}

// MarkAttachmentAIDone stores the AI-generated description and, only when
// the attachment has no user-set label yet, the AI-generated name too.
func MarkAttachmentAIDone(id uuid.UUID, label string, description string, db *gorm.DB) error {
	return db.Model(&models.Attachment{}).
		Where("id = ?", id).
		Updates(map[string]any{
			"description":     description,
			"ai_status":       "done",
			"ai_processed_at": time.Now(),
			"label":           gorm.Expr("COALESCE(NULLIF(label, ''), ?)", label),
		}).Error
}

// MarkAttachmentAIFailed increments the attempt counter and either requeues
// the attachment as 'pending' for a later retry or, once maxAttempts is
// reached, gives up on it permanently by marking it 'failed'.
func MarkAttachmentAIFailed(id uuid.UUID, maxAttempts int, db *gorm.DB) error {
	return db.Model(&models.Attachment{}).
		Where("id = ?", id).
		Updates(map[string]any{
			"ai_attempts": gorm.Expr("ai_attempts + 1"),
			"ai_status":   gorm.Expr("CASE WHEN ai_attempts + 1 >= ? THEN 'failed' ELSE 'pending' END", maxAttempts),
		}).Error
}
