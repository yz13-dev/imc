package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"sync/atomic"
	"time"

	"github.com/yz13-dev/imc/api/internal/models"
)

type GetUserResponse struct {
	User    models.User    `json:"user"`
	Session models.Session `json:"session"`
}

type ResolutionSource string

const (
	ResolutionAnonymous   ResolutionSource = "anonymous"
	ResolutionBearerJWT   ResolutionSource = "bearer_jwt"
	ResolutionCookieCache ResolutionSource = "cookie_cache"
	ResolutionAuthService ResolutionSource = "auth_service"
	ResolutionUserInfo    ResolutionSource = "userinfo"
	ResolutionFailed      ResolutionSource = "failed"
)

type ResolutionStats struct {
	Anonymous   uint64
	BearerJWT   uint64
	CookieCache uint64
	AuthService uint64
	UserInfo    uint64
	Failed      uint64
}

var (
	authHTTPClient = &http.Client{Timeout: 2 * time.Second}
	cookieSessions = newSessionCache(cookieSessionCacheTTL)
	authBaseURL    string
	authStats      struct {
		anonymous   atomic.Uint64
		bearerJWT   atomic.Uint64
		cookieCache atomic.Uint64
		authService atomic.Uint64
		userInfo    atomic.Uint64
		failed      atomic.Uint64
	}
)

func AuthStats() ResolutionStats {
	return ResolutionStats{
		Anonymous:   authStats.anonymous.Load(),
		BearerJWT:   authStats.bearerJWT.Load(),
		CookieCache: authStats.cookieCache.Load(),
		AuthService: authStats.authService.Load(),
		UserInfo:    authStats.userInfo.Load(),
		Failed:      authStats.failed.Load(),
	}
}

// GetUser resolves the caller's identity against central auth. Signed bearer
// JWTs are verified locally, successful cookie sessions are cached for a short
// time, and opaque bearer tokens retain the auth-service fallback path.
func GetUser(ctx context.Context, cookies []*http.Cookie, authorization string) (*GetUserResponse, error) {
	user, _, err := ResolveUser(ctx, cookies, authorization)
	return user, err
}

func ResolveUser(ctx context.Context, cookies []*http.Cookie, authorization string) (*GetUserResponse, ResolutionSource, error) {
	base := getAuthBaseURL()

	if token := bearerToken(authorization); looksLikeJWT(token) {
		if identity, err := verifyIdentityJWT(base, token); err == nil {
			authStats.bearerJWT.Add(1)
			return identity, ResolutionBearerJWT, nil
		}
	}

	cacheKey := ""
	canUseCookieCache := len(cookies) > 0 && authorization == ""
	if canUseCookieCache {
		cacheKey = cookieSessionCacheKey(base, cookies)
		if session, ok := cookieSessions.get(cacheKey); ok {
			authStats.cookieCache.Add(1)
			return session, ResolutionCookieCache, nil
		}
	}

	if len(cookies) > 0 || authorization != "" {
		session, err := getSession(ctx, base, cookies, authorization)
		if err != nil {
			authStats.failed.Add(1)
			return nil, ResolutionFailed, err
		}
		if session != nil {
			if canUseCookieCache {
				cookieSessions.set(cacheKey, session)
			}
			authStats.authService.Add(1)
			return session, ResolutionAuthService, nil
		}
	}

	if authorization == "" {
		authStats.anonymous.Add(1)
		return nil, ResolutionAnonymous, fmt.Errorf("no session")
	}

	user, err := getUserInfo(ctx, base, authorization)
	if err != nil {
		authStats.failed.Add(1)
		return nil, ResolutionFailed, err
	}
	authStats.userInfo.Add(1)
	return user, ResolutionUserInfo, nil
}

func getAuthBaseURL() string {
	if authBaseURL != "" {
		return authBaseURL
	}

	if os.Getenv("APP_ENV") == "production" {
		return "https://auth.yz13.dev"
	}
	return "https://preview.auth.yz13.dev"
}

func bearerToken(authorization string) string {
	return strings.TrimSpace(strings.TrimPrefix(authorization, "Bearer "))
}

func looksLikeJWT(token string) bool {
	return strings.Count(token, ".") == 2
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

	resp, err := authHTTPClient.Do(req)
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

	resp, err := authHTTPClient.Do(req)
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
