package utils

import (
	"bytes"
	"encoding/json"
	"fmt"
	"math"
	"os/exec"
	"strconv"
	"strings"
)

type VideoMetadata struct {
	Width      int
	Height     int
	DurationMs int64
}
type ffprobeResult struct {
	Streams []struct {
		Width  int `json:"width"`
		Height int `json:"height"`
	} `json:"streams"`

	Format struct {
		Duration string `json:"duration"`
	} `json:"format"`
}

func ProbeVideo(path string) (VideoMetadata, error) {
	cmd := exec.Command(
		"ffprobe",
		"-v", "error",
		"-select_streams", "v:0",
		"-show_entries", "stream=width,height",
		"-show_entries", "format=duration",
		"-of", "json",
		path,
	)

	out, err := cmd.Output()
	if err != nil {
		return VideoMetadata{}, err
	}

	var res ffprobeResult
	if err := json.Unmarshal(out, &res); err != nil {
		return VideoMetadata{}, err
	}

	if len(res.Streams) == 0 {
		return VideoMetadata{}, fmt.Errorf("no video stream found")
	}

	width := res.Streams[0].Width
	height := res.Streams[0].Height

	seconds, err := strconv.ParseFloat(strings.TrimSpace(res.Format.Duration), 64)
	if err != nil {
		return VideoMetadata{}, err
	}

	return VideoMetadata{
		Width:      width,
		Height:     height,
		DurationMs: int64(math.Round(seconds * 1000)),
	}, nil
}

// ExtractKeyframe grabs a single JPEG frame from the middle of the video at
// `path` (by `durationMs`, as already computed via ProbeVideo) and returns
// it as encoded JPEG bytes, streamed straight from ffmpeg's stdout without
// touching disk for the output frame.
func ExtractKeyframe(path string, durationMs int64) ([]byte, error) {
	seekSeconds := float64(durationMs) / 2 / 1000
	if seekSeconds < 0 {
		seekSeconds = 0
	}

	cmd := exec.Command(
		"ffmpeg",
		"-ss", strconv.FormatFloat(seekSeconds, 'f', 3, 64),
		"-i", path,
		"-frames:v", "1",
		"-f", "image2pipe",
		"-vcodec", "mjpeg",
		"-",
	)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("ffmpeg keyframe extraction failed: %w: %s", err, stderr.String())
	}
	if stdout.Len() == 0 {
		return nil, fmt.Errorf("ffmpeg produced no keyframe output")
	}

	return stdout.Bytes(), nil
}
