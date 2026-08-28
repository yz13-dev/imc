package ai

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"regexp"
	"strings"

	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
)

const defaultModel = "dashscope/qwen3.5-flash"

const systemPrompt = `You are an assistant that labels media for a personal media library.
Given a single image, respond with ONLY a JSON object (no markdown, no commentary) shaped like:
{"name": "short title, max 60 characters", "description": "one or two sentence description", "tags": ["lowercase", "single-word-or-short-phrase", "up to 8 tags"]}`

// AIResult is the sanitized outcome of analyzing one image.
type AIResult struct {
	Name        string
	Description string
	Tags        []string
}

type rawResult struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Tags        []string `json:"tags"`
}

var jsonObjectPattern = regexp.MustCompile(`(?s)\{.*\}`)

// NewClient builds an OpenAI-compatible client pointed at the configured AI
// gateway (e.g. Timeweb AI Gateway).
func NewClient() *openai.Client {
	client := openai.NewClient(
		option.WithAPIKey(os.Getenv("AI_GATEWAY_API_KEY")),
		option.WithBaseURL(os.Getenv("AI_GATEWAY_BASE_URL")),
	)
	return &client
}

func modelName() string {
	if model := os.Getenv("AI_MODEL"); model != "" {
		return model
	}
	return defaultModel
}

// AnalyzeImage sends a single image to the configured vision model and
// returns a sanitized name/description/tags result.
func AnalyzeImage(ctx context.Context, client *openai.Client, imageBytes []byte, mimeType string) (AIResult, error) {
	dataURL := fmt.Sprintf("data:%s;base64,%s", mimeType, base64.StdEncoding.EncodeToString(imageBytes))

	resp, err := client.Chat.Completions.New(ctx, openai.ChatCompletionNewParams{
		Model: modelName(),
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.SystemMessage(systemPrompt),
			openai.UserMessage([]openai.ChatCompletionContentPartUnionParam{
				openai.TextContentPart("Label this image."),
				openai.ImageContentPart(openai.ChatCompletionContentPartImageImageURLParam{URL: dataURL}),
			}),
		},
	})
	if err != nil {
		return AIResult{}, fmt.Errorf("ai gateway request failed: %w", err)
	}
	if len(resp.Choices) == 0 {
		return AIResult{}, fmt.Errorf("ai gateway returned no choices")
	}

	return parseResult(resp.Choices[0].Message.Content)
}

func parseResult(content string) (AIResult, error) {
	match := jsonObjectPattern.FindString(content)
	if match == "" {
		return AIResult{}, fmt.Errorf("no JSON object found in ai response: %q", content)
	}

	var raw rawResult
	if err := json.Unmarshal([]byte(match), &raw); err != nil {
		return AIResult{}, fmt.Errorf("failed to parse ai response JSON: %w", err)
	}

	return AIResult{
		Name:        strings.TrimSpace(truncate(raw.Name, 60)),
		Description: strings.TrimSpace(raw.Description),
		Tags:        sanitizeTags(raw.Tags),
	}, nil
}

func sanitizeTags(tags []string) []string {
	seen := make(map[string]struct{}, len(tags))
	out := make([]string, 0, len(tags))
	for _, tag := range tags {
		tag = strings.ToLower(strings.TrimSpace(tag))
		if tag == "" || len(tag) > 40 {
			continue
		}
		if _, ok := seen[tag]; ok {
			continue
		}
		seen[tag] = struct{}{}
		out = append(out, tag)
		if len(out) >= 8 {
			break
		}
	}
	return out
}

func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max]
}
