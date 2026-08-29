package handlers

import (
	"net/http/httptest"
	"testing"
)

func TestParseAttachmentListQuery(t *testing.T) {
	tests := []struct {
		name           string
		url            string
		wantOffset     int
		wantLimit      int
		wantTagsLength int
	}{
		{name: "defaults", url: "/v1/my/attachments", wantLimit: defaultListLimit},
		{name: "valid", url: "/v1/my/attachments?offset=50&limit=40&tags=design,%20video", wantOffset: 50, wantLimit: 40, wantTagsLength: 2},
		{name: "negative offset", url: "/v1/my/attachments?offset=-1", wantLimit: defaultListLimit},
		{name: "zero limit", url: "/v1/my/attachments?limit=0", wantLimit: defaultListLimit},
		{name: "limit cap", url: "/v1/my/attachments?limit=1000", wantLimit: maxListLimit},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			request := httptest.NewRequest("GET", test.url, nil)
			query := parseAttachmentListQuery(request)
			if query.Offset != test.wantOffset || query.Limit != test.wantLimit || len(query.Tags) != test.wantTagsLength {
				t.Fatalf("parseAttachmentListQuery() = %+v", query)
			}
		})
	}
}
