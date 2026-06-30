package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/yz13-dev/imc/api/internal/models"
)

type GetUserResponse struct {
	User    models.User    `json:"user"`
	Session models.Session `json:"session"`
}

func GetUser(ctx context.Context, cookies []*http.Cookie) (*GetUserResponse, error) {

	isProd := os.Getenv("APP_ENV") == "production"

	base := "https://localhost:4444"
	if isProd {
		base = "https://auth.yz13.dev"
	}
	const path = "/api/auth/get-session"

	url := fmt.Sprintf("%s%s", base, path)

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodGet,
		url,
		nil,
	)
	if err != nil {
		return nil, err
	}

	for _, cookie := range cookies {
		req.AddCookie(cookie)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status: %d", resp.StatusCode)
	}

	var session *GetUserResponse
	if err := json.NewDecoder(resp.Body).Decode(&session); err != nil {
		return nil, err
	}

	return session, nil
}
