package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"

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
// Both apps/web (via @yz13/auth-sdk's OAuth access token) and the browser
// extension (via a plain identity token minted at /api/auth/token) send a
// *different* kind of bearer credential than a real session token.
// get-session only recognizes actual session tokens (from bearer()/cookies)
// and returns "200 null" -- not an error -- for anything else, so these
// silently resolve to no user. Both are EdDSA JWTs signed by the same JWKS
// central auth publishes, just carrying different claims, so they're
// verified locally instead of via another round trip to auth. As a last
// resort (e.g. an opaque, non-JWT access token), fall back to
// /oauth2/userinfo, the endpoint that validates OAuth access tokens.
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

	token := strings.TrimPrefix(authorization, "Bearer ")
	if identity, err := verifyIdentityJWT(base, token); err == nil {
		return identity, nil
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
