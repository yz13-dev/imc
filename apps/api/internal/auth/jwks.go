package auth

import (
	"crypto/ed25519"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/yz13-dev/imc/api/internal/models"
)

// Central auth signs every JWT it issues (both the plain jwt() plugin's
// identity tokens and the oauthProvider's JWT-format access tokens) with the
// same EdDSA key, published at {issuer}/api/auth/jwks. Verifying locally
// avoids a network round trip per request and works for both token shapes,
// since both simply differ in which claims they carry, not how they're signed.

type jwk struct {
	Kty string `json:"kty"`
	Crv string `json:"crv"`
	X   string `json:"x"`
	Kid string `json:"kid"`
	Alg string `json:"alg"`
}

type jwksResponse struct {
	Keys []jwk `json:"keys"`
}

var (
	jwksCache   = map[string]map[string]ed25519.PublicKey{}
	jwksCacheMu sync.RWMutex
	jwksFetched = map[string]time.Time{}
	jwksTTL     = 10 * time.Minute
)

func fetchJWKS(base string) (map[string]ed25519.PublicKey, error) {
	jwksCacheMu.RLock()
	fetchedAt, ok := jwksFetched[base]
	jwksCacheMu.RUnlock()
	if ok && time.Since(fetchedAt) < jwksTTL {
		jwksCacheMu.RLock()
		defer jwksCacheMu.RUnlock()
		return jwksCache[base], nil
	}

	resp, err := authHTTPClient.Get(fmt.Sprintf("%s/api/auth/jwks", base))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected jwks status: %d", resp.StatusCode)
	}

	var parsed jwksResponse
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return nil, err
	}

	keys := map[string]ed25519.PublicKey{}
	for _, k := range parsed.Keys {
		if k.Kty != "OKP" || k.Crv != "Ed25519" {
			continue
		}
		raw, err := base64.RawURLEncoding.DecodeString(k.X)
		if err != nil || len(raw) != ed25519.PublicKeySize {
			continue
		}
		keys[k.Kid] = ed25519.PublicKey(raw)
	}

	jwksCacheMu.Lock()
	jwksCache[base] = keys
	jwksFetched[base] = time.Now()
	jwksCacheMu.Unlock()

	return keys, nil
}

type identityClaims struct {
	Name string `json:"name"`
	jwt.RegisteredClaims
}

// verifyIdentityJWT verifies a bearer token's signature against central
// auth's published JWKS and checks issuer/expiry -- no network call beyond
// the (cached) JWKS fetch. Covers both the plain jwt() plugin's identity
// tokens and oauthProvider's JWT-format access tokens.
func verifyIdentityJWT(base string, token string) (*GetUserResponse, error) {
	keys, err := fetchJWKS(base)
	if err != nil {
		return nil, err
	}

	var claims identityClaims
	parsed, err := jwt.ParseWithClaims(token, &claims, func(t *jwt.Token) (any, error) {
		if t.Method.Alg() != "EdDSA" {
			return nil, fmt.Errorf("unexpected signing method: %s", t.Method.Alg())
		}
		kid, _ := t.Header["kid"].(string)
		key, ok := keys[kid]
		if !ok {
			return nil, fmt.Errorf("unknown key id: %s", kid)
		}
		return key, nil
	}, jwt.WithIssuer(base), jwt.WithExpirationRequired())
	if err != nil || !parsed.Valid {
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	sub, err := claims.GetSubject()
	if err != nil || sub == "" {
		return nil, fmt.Errorf("token missing sub claim")
	}

	return &GetUserResponse{
		User: models.User{ID: sub, Name: claims.Name},
	}, nil
}
