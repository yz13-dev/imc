package repositories

import (
	"encoding/base64"
	"errors"
	"strconv"
	"strings"
	"time"
)

// Cursor identifies a position in a created_at DESC, id DESC ordered list.
// The id half is a tie-breaker for rows sharing the same created_at value.
type Cursor struct {
	CreatedAt time.Time
	ID        string
}

// EncodeCursor packs a row's created_at/id into an opaque, URL-safe string.
func EncodeCursor(createdAt time.Time, id string) string {
	raw := strconv.FormatInt(createdAt.UnixNano(), 10) + "_" + id
	return base64.RawURLEncoding.EncodeToString([]byte(raw))
}

// DecodeCursor reverses EncodeCursor. An empty string decodes to a nil
// cursor, meaning "start from the beginning".
func DecodeCursor(s string) (*Cursor, error) {
	if s == "" {
		return nil, nil
	}
	raw, err := base64.RawURLEncoding.DecodeString(s)
	if err != nil {
		return nil, err
	}
	nanos, id, ok := strings.Cut(string(raw), "_")
	if !ok || id == "" {
		return nil, errors.New("invalid cursor")
	}
	ts, err := strconv.ParseInt(nanos, 10, 64)
	if err != nil {
		return nil, err
	}
	return &Cursor{CreatedAt: time.Unix(0, ts), ID: id}, nil
}

// Page wraps a list response with the cursor to request the next page.
// NextCursor is empty once there are no more rows.
type Page[T any] struct {
	Items      []T    `json:"items"`
	NextCursor string `json:"next_cursor"`
}
