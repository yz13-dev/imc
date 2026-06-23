package models

type Collection struct {
	ID          string `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	CreatedAt   string `gorm:"default:now()" json:"created_at"`
	UpdatedAt   string `gorm:"default:now()" json:"updated_at"`
	UserID      int    `json:"user_id"`
	Public      bool   `gorm:"default:false" json:"public"`
}

type NewCollection struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	UserID      int    `json:"user_id"`
	Public      bool   `json:"public"`
}

type UpdateCollection struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}
