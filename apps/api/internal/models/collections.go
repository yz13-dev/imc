package models

type Collection struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
	UserID      int    `json:"user_id"`
}

type NewCollection struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	UserID      int    `json:"user_id"`
}

type UpdateCollection struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}
