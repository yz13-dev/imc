package auth

import (
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"sort"
	"strings"
	"sync"
	"time"
)

const cookieSessionCacheTTL = 5 * time.Second

type cachedSession struct {
	response  GetUserResponse
	expiresAt time.Time
}

type sessionCache struct {
	mu      sync.Mutex
	ttl     time.Duration
	entries map[string]cachedSession
}

func newSessionCache(ttl time.Duration) *sessionCache {
	return &sessionCache{ttl: ttl, entries: make(map[string]cachedSession)}
}

func (c *sessionCache) get(key string) (*GetUserResponse, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()

	entry, ok := c.entries[key]
	if !ok {
		return nil, false
	}
	if time.Now().After(entry.expiresAt) {
		delete(c.entries, key)
		return nil, false
	}

	response := entry.response
	return &response, true
}

func (c *sessionCache) set(key string, response *GetUserResponse) {
	if response == nil {
		return
	}

	c.mu.Lock()
	defer c.mu.Unlock()

	now := time.Now()
	for key, entry := range c.entries {
		if now.After(entry.expiresAt) {
			delete(c.entries, key)
		}
	}
	c.entries[key] = cachedSession{response: *response, expiresAt: now.Add(c.ttl)}
}

func cookieSessionCacheKey(base string, cookies []*http.Cookie) string {
	parts := make([]string, 0, len(cookies)+1)
	parts = append(parts, base)
	for _, cookie := range cookies {
		parts = append(parts, cookie.Name+"="+cookie.Value)
	}
	sort.Strings(parts[1:])

	sum := sha256.Sum256([]byte(strings.Join(parts, "\n")))
	return hex.EncodeToString(sum[:])
}
