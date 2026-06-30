package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/yz13-dev/imc/api/internal/models"
)

type GetUserResponse struct {
	User    models.User    `json:"user"`
	Session models.Session `json:"session"`
}

func GetUser(ctx context.Context, cookies []*http.Cookie) (*GetUserResponse, error) {
	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodGet,
		"https://localhost:4444/api/auth/get-session",
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
