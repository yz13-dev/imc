package utils

import "os"

func GetOrigins() []string {
	IsProd := os.Getenv("APP_ENV") == "production"
	if IsProd {
		return []string{
			"https://*.yz13.dev",
			"https://imc.yz13.dev",
			"https://yz13.dev",
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
