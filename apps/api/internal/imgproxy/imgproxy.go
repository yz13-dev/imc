package imgproxy

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

var client = &http.Client{Timeout: 30 * time.Second}

type Options struct {
	Width   int
	Height  int
	Fit     string
	Format  string
	Quality int
}

func OptionsFromQuery(q map[string][]string) Options {
	get := func(key string) string {
		if v, ok := q[key]; ok && len(v) > 0 {
			return v[0]
		}
		return ""
	}

	width, _ := strconv.Atoi(get("w"))
	height, _ := strconv.Atoi(get("h"))
	quality, _ := strconv.Atoi(get("q"))

	return Options{
		Width:   width,
		Height:  height,
		Fit:     get("fit"),
		Format:  get("format"),
		Quality: quality,
	}
}

func BuildURL(bucket, key string, opts Options) string {
	base := strings.TrimRight(os.Getenv("IMGPROXY_URL"), "/")

	var segments []string

	if opts.Width > 0 || opts.Height > 0 {
		fit := opts.Fit
		if fit == "" {
			fit = "fit"
		}
		segments = append(segments, fmt.Sprintf("rs:%s:%d:%d:0", fit, opts.Width, opts.Height))
	}

	if opts.Format != "" {
		segments = append(segments, fmt.Sprintf("f:%s", opts.Format))
	}

	if opts.Quality > 0 {
		segments = append(segments, fmt.Sprintf("q:%d", opts.Quality))
	}

	processing := strings.Join(segments, "/")
	source := fmt.Sprintf("s3://%s/%s", bucket, key)

	if processing == "" {
		return fmt.Sprintf("%s/insecure/plain/%s", base, source)
	}
	return fmt.Sprintf("%s/insecure/%s/plain/%s", base, processing, source)
}

func Fetch(ctx context.Context, url string, ifNoneMatch string) (*http.Response, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	if ifNoneMatch != "" {
		req.Header.Set("If-None-Match", ifNoneMatch)
	}
	return client.Do(req)
}
