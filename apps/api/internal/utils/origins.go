package utils

import (
	"os"
	"regexp"
	"strings"
)

func MatchOrigin(allowed []string, origin string) bool {
	for _, pattern := range allowed {
		if pattern == origin {
			return true
		}
		if !strings.Contains(pattern, "*") {
			continue
		}
		regexPattern := "^" + strings.ReplaceAll(regexp.QuoteMeta(pattern), `\*`, ".*") + "$"
		if matched, _ := regexp.MatchString(regexPattern, origin); matched {
			return true
		}
	}
	return false
}

func GetOrigins() []string {
	IsProd := os.Getenv("APP_ENV") == "production"
	if IsProd {
		return []string{
			"https://*.yz13.dev",
			"https://imc.yz13.dev",
			"https://yz13.dev",
			"moz-extension://*",
			"chrome-extension://*",
		}
	} else {
		return []string{
			"moz-extension://*",
			"chrome-extension://*",
			"http://localhost:5173",
			"http://localhost:3000",
			"http://127.0.0.1:3000",
			"http://[::1]:3000",
		}
	}
}
