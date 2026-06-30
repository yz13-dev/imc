


/*
ID          string    `gorm:"primaryKey"`
  UserID      int64     `json:"user_id"`
  Title       string    `json:"title"`
  Description string    `json:"description"`
  CreatedAt   time.Time `gorm:"default:now()" json:"created_at"`
  UpdatedAt   time.Time `gorm:"default:now()" json:"updated_at"`
*/
export type Card = {
  id: string
  title: string
  description: string
  user_id: string
  created_at: string
  updated_at: string
}

export type NewCard = {
  title: string
  description: string
  user_id: string
}
