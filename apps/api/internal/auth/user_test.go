package auth

import (
	"context"
	"crypto/ed25519"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func setupAuthTest(t *testing.T, base string, cache *sessionCache) {
	t.Helper()
	oldBase := authBaseURL
	oldCache := cookieSessions
	authBaseURL = base
	cookieSessions = cache

	jwksCacheMu.Lock()
	oldJWKSCache := jwksCache
	oldJWKSFetched := jwksFetched
	jwksCache = map[string]map[string]ed25519.PublicKey{}
	jwksFetched = map[string]time.Time{}
	jwksCacheMu.Unlock()

	t.Cleanup(func() {
		authBaseURL = oldBase
		cookieSessions = oldCache
		jwksCacheMu.Lock()
		jwksCache = oldJWKSCache
		jwksFetched = oldJWKSFetched
		jwksCacheMu.Unlock()
	})
}

func TestResolveUserCachesCookieSession(t *testing.T) {
	var sessionCalls atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/auth/get-session" {
			http.NotFound(w, r)
			return
		}
		sessionCalls.Add(1)
		_ = json.NewEncoder(w).Encode(map[string]any{"user": map[string]string{"id": "user-1", "name": "User"}})
	}))
	defer server.Close()
	setupAuthTest(t, server.URL, newSessionCache(5*time.Second))

	cookies := []*http.Cookie{{Name: "session", Value: "token"}}
	for range 2 {
		user, source, err := ResolveUser(context.Background(), cookies, "")
		if err != nil || user == nil || user.User.ID != "user-1" {
			t.Fatalf("ResolveUser() = %v, %v, %v", user, source, err)
		}
	}

	if got := sessionCalls.Load(); got != 1 {
		t.Fatalf("get-session calls = %d, want 1", got)
	}
}

func TestResolveUserDoesNotCacheAnonymousSession(t *testing.T) {
	var sessionCalls atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sessionCalls.Add(1)
		_, _ = w.Write([]byte("null"))
	}))
	defer server.Close()
	setupAuthTest(t, server.URL, newSessionCache(5*time.Second))

	cookies := []*http.Cookie{{Name: "session", Value: "missing"}}
	for range 2 {
		user, source, err := ResolveUser(context.Background(), cookies, "")
		if user != nil || source != ResolutionAnonymous || err == nil {
			t.Fatalf("ResolveUser() = %v, %v, %v", user, source, err)
		}
	}

	if got := sessionCalls.Load(); got != 2 {
		t.Fatalf("get-session calls = %d, want 2", got)
	}
}

func TestResolveUserRefreshesExpiredCookieSession(t *testing.T) {
	var sessionCalls atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sessionCalls.Add(1)
		_ = json.NewEncoder(w).Encode(map[string]any{"user": map[string]string{"id": "user-1"}})
	}))
	defer server.Close()
	setupAuthTest(t, server.URL, newSessionCache(time.Millisecond))

	cookies := []*http.Cookie{{Name: "session", Value: "token"}}
	if _, _, err := ResolveUser(context.Background(), cookies, ""); err != nil {
		t.Fatal(err)
	}
	time.Sleep(2 * time.Millisecond)
	if _, _, err := ResolveUser(context.Background(), cookies, ""); err != nil {
		t.Fatal(err)
	}

	if got := sessionCalls.Load(); got != 2 {
		t.Fatalf("get-session calls = %d, want 2", got)
	}
}

func TestResolveUserWithoutCredentialsSkipsAuthService(t *testing.T) {
	var calls atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls.Add(1)
		http.Error(w, "unexpected call", http.StatusInternalServerError)
	}))
	defer server.Close()
	setupAuthTest(t, server.URL, newSessionCache(5*time.Second))

	user, source, err := ResolveUser(context.Background(), nil, "")
	if user != nil || source != ResolutionAnonymous || err == nil {
		t.Fatalf("ResolveUser() = %v, %v, %v", user, source, err)
	}
	if got := calls.Load(); got != 0 {
		t.Fatalf("auth calls = %d, want 0", got)
	}
}

func TestResolveUserVerifiesBearerJWTBeforeSessionLookup(t *testing.T) {
	publicKey, privateKey, err := ed25519.GenerateKey(nil)
	if err != nil {
		t.Fatal(err)
	}

	var sessionCalls atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api/auth/jwks":
			_ = json.NewEncoder(w).Encode(jwksResponse{Keys: []jwk{{
				Kty: "OKP", Crv: "Ed25519", Kid: "test-key", Alg: "EdDSA",
				X: base64.RawURLEncoding.EncodeToString(publicKey),
			}}})
		case "/api/auth/get-session":
			sessionCalls.Add(1)
			http.Error(w, "must not be called", http.StatusInternalServerError)
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()
	setupAuthTest(t, server.URL, newSessionCache(5*time.Second))

	claims := identityClaims{RegisteredClaims: jwt.RegisteredClaims{
		Issuer:    server.URL,
		Subject:   "user-1",
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Minute)),
	}}
	token := jwt.NewWithClaims(jwt.SigningMethodEdDSA, claims)
	token.Header["kid"] = "test-key"
	signed, err := token.SignedString(privateKey)
	if err != nil {
		t.Fatal(err)
	}

	user, source, err := ResolveUser(context.Background(), nil, "Bearer "+signed)
	if err != nil || source != ResolutionBearerJWT || user == nil || user.User.ID != "user-1" {
		t.Fatalf("ResolveUser() = %v, %v, %v", user, source, err)
	}
	if got := sessionCalls.Load(); got != 0 {
		t.Fatalf("get-session calls = %d, want 0", got)
	}
}

func TestSessionCacheConcurrentAccess(t *testing.T) {
	cache := newSessionCache(time.Second)
	cache.set("key", &GetUserResponse{})

	var wg sync.WaitGroup
	for range 64 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for range 100 {
				cache.set("key", &GetUserResponse{})
				_, _ = cache.get("key")
			}
		}()
	}
	wg.Wait()
}
