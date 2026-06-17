package models

type Attachment struct {
	ID         string `gorm:"primaryKey"`
	CardID     string
	Type       string
	MimeType   string
	Src        string
	Width      int
	Height     int
	DurationMS int
	FileSize   int64
	IsCover    bool
	Blurhash   string
	CreatedAt  string
}
