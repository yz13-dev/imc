package handlers

import (
	"net/http/httptest"
	"testing"
	"time"

	"github.com/yz13-dev/imc/api/internal/repositories"
)

func TestParseAttachmentListQuery(t *testing.T) {
	validCursor := repositories.EncodeCursor(time.Unix(0, 1700000000000000000), "11111111-1111-1111-1111-111111111111")

	tests := []struct {
		name           string
		url            string
		wantCursor     bool
		wantLimit      int
		wantTagsLength int
	}{
		{name: "defaults", url: "/v1/my/attachments", wantLimit: defaultListLimit},
		{name: "valid", url: "/v1/my/attachments?cursor=" + validCursor + "&limit=40&tags=design,%20video", wantCursor: true, wantLimit: 40, wantTagsLength: 2},
		{name: "invalid cursor", url: "/v1/my/attachments?cursor=not-a-cursor", wantLimit: defaultListLimit},
		{name: "zero limit", url: "/v1/my/attachments?limit=0", wantLimit: defaultListLimit},
		{name: "limit cap", url: "/v1/my/attachments?limit=1000", wantLimit: maxListLimit},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			request := httptest.NewRequest("GET", test.url, nil)
			query := parseAttachmentListQuery(request)
			hasCursor := query.Cursor != nil
			if hasCursor != test.wantCursor || query.Limit != test.wantLimit || len(query.Tags) != test.wantTagsLength {
				t.Fatalf("parseAttachmentListQuery() = %+v", query)
			}
		})
	}
}
