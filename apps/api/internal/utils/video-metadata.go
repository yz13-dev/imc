package utils

import (
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
