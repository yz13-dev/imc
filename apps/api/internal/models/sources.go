package models

/*
id uuid primary key
  default gen_random_uuid(),

slug text unique not null,

name text not null,

domain text,

favicon_url text,

created_at timestamptz not null
  default now()
*/

type Source struct {
	ID           string  `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	Slug         string  `json:"slug"`
	Name         string  `json:"name"`
	Domain       string  `json:"domain"`
	FaviconURL   *string `json:"favicon_url"`
	AttachmentID *string `json:"attachment_id"`
	CreatedAt    string  `gorm:"default:now()" json:"created_at"`
}

type NewSource struct {
	Slug         string  `json:"slug"`
	Name         string  `json:"name"`
	Domain       string  `json:"domain"`
	FaviconURL   *string `json:"favicon_url"`
	AttachmentID *string `json:"attachment_id"`
}

type SourceCheck struct {
	Exist bool    `json:"exist"`
	ID    *string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
}
