package config

import (
	"github.com/thecodearcher/limen"
	credentialpassword "github.com/thecodearcher/limen/plugins/credential-password"
)

func NewAuthConfig(adapter limen.DatabaseAdapter) *limen.Config {
	return &limen.Config{
		BaseURL:  "http://localhost:8080",
		Database: adapter,
		CLI: &limen.CLIConfig{
			Enabled: true,
		},
		Plugins: []limen.Plugin{
			credentialpassword.New(
				credentialpassword.WithRequireUsernameOnSignUp(true),
				credentialpassword.WithUsernameMinLength(4),
				credentialpassword.WithUsernameMaxLength(20),
			),
		},
	}
}
