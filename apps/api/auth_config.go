package config

import (
	"net/http"
	"time"

	"github.com/thecodearcher/limen"
	credentialpassword "github.com/thecodearcher/limen/plugins/credential-password"
	"github.com/yz13-dev/imc/api/internal/utils"
)

func NewAuthConfig(adapter limen.DatabaseAdapter) *limen.Config {
	return &limen.Config{
		BaseURL:  "http://localhost:8080",
		Database: adapter,
		CLI: &limen.CLIConfig{
			Enabled: true,
		},
		HTTP: limen.NewDefaultHTTPConfig(
			limen.WithHTTPSessionCookieName("imc_session"),
			limen.WithHTTPCookieSameSite(http.SameSiteNoneMode),
			limen.WithHTTPCookieSecure(false),
			limen.WithHTTPCookieHTTPOnly(true),
			limen.WithHTTPOriginCheck(true),
			limen.WithHTTPCookieCrossDomainEnabled(),
			limen.WithHTTPTrustedOrigins(utils.GetOrigins()),
			limen.WithHTTPSessionTransformer(func(user map[string]any, sessionResult *limen.SessionResult) (map[string]any, error) {
				out := map[string]any{"user": user}
				if sessionResult != nil {
					out["token"] = sessionResult.Token
				}
				return out, nil
			}),
		),
		Session: limen.NewDefaultSessionConfig(
			limen.WithBearerEnabled(),
			limen.WithSessionDuration(7*24*time.Hour), // 7 days
			limen.WithSessionUpdateAge(24*time.Hour),  // refresh every 1 day of activity
		),
		Plugins: []limen.Plugin{
			credentialpassword.New(
				credentialpassword.WithRequireUsernameOnSignUp(true),
				credentialpassword.WithUsernameMinLength(4),
				credentialpassword.WithUsernameMaxLength(20),
			),
		},
	}
}
