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

// GetUser resolves the caller's identity against the central auth service.
// It forwards both cookies (the web app's old path, via crossSubDomainCookies)
// and the Authorization header (the browser extension's path, via
// better-auth's bearer plugin) to get-session first — the extension has no
// cookie jar for the auth service's origin, so cookie-only forwarding left
// its requests silently unauthenticated.
//
// apps/web now sends a *different* kind of bearer credential: an OAuth2
// access token minted via @yz13/auth-sdk's authorization-code flow.
// get-session only recognizes real session tokens (from bearer()/cookies)
// and returns "200 null" -- not an error -- for anything else, so an OAuth
// access token silently resolves to no user. When that happens and an
// Authorization header was actually provided, fall back to /oauth2/userinfo,
// which is the endpoint that validates OAuth access tokens.
func GetUser(ctx context.Context, cookies []*http.Cookie, authorization string) (*GetUserResponse, error) {

	isProd := os.Getenv("APP_ENV") == "production"

	base := "https://preview.auth.yz13.dev"
	if isProd {
		base = "https://auth.yz13.dev"
	}

	session, err := getSession(ctx, base, cookies, authorization)
	if err != nil {
		return nil, err
	}
	if session != nil {
		return session, nil
	}
	if authorization == "" {
		return nil, fmt.Errorf("no session")
	}

	return getUserInfo(ctx, base, authorization)
}

func getSession(ctx context.Context, base string, cookies []*http.Cookie, authorization string) (*GetUserResponse, error) {
	url := fmt.Sprintf("%s/api/auth/get-session", base)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	for _, cookie := range cookies {
		req.AddCookie(cookie)
	}
	if authorization != "" {
		req.Header.Set("Authorization", authorization)
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

type userInfoClaims struct {
	Sub  string `json:"sub"`
	Name string `json:"name"`
}

func getUserInfo(ctx context.Context, base string, authorization string) (*GetUserResponse, error) {
	url := fmt.Sprintf("%s/api/auth/oauth2/userinfo", base)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", authorization)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status: %d", resp.StatusCode)
	}

	var claims userInfoClaims
	if err := json.NewDecoder(resp.Body).Decode(&claims); err != nil {
		return nil, err
	}
	if claims.Sub == "" {
		return nil, fmt.Errorf("userinfo: missing sub claim")
	}

	return &GetUserResponse{
		User: models.User{ID: claims.Sub, Name: claims.Name},
	}, nil
}
