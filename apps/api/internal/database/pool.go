package database

import (
	"os"
	"strconv"
	"time"

	"gorm.io/gorm"
)

const (
	defaultMaxOpenConns    = 20
	defaultMaxIdleConns    = 10
	defaultConnMaxLifetime = 30 * time.Minute
	defaultConnMaxIdleTime = 5 * time.Minute
)

// ConfigurePool applies bounded, reusable connection-pool defaults. Every
// value can be tuned per deployment without changing the binary.
func ConfigurePool(db *gorm.DB) error {
	sqlDB, err := db.DB()
	if err != nil {
		return err
	}

	sqlDB.SetMaxOpenConns(envInt("DATABASE_MAX_OPEN_CONNS", defaultMaxOpenConns))
	sqlDB.SetMaxIdleConns(envInt("DATABASE_MAX_IDLE_CONNS", defaultMaxIdleConns))
	sqlDB.SetConnMaxLifetime(envDuration("DATABASE_CONN_MAX_LIFETIME", defaultConnMaxLifetime))
	sqlDB.SetConnMaxIdleTime(envDuration("DATABASE_CONN_MAX_IDLE_TIME", defaultConnMaxIdleTime))
	return nil
}

func envInt(key string, fallback int) int {
	value, err := strconv.Atoi(os.Getenv(key))
	if err != nil || value <= 0 {
		return fallback
	}
	return value
}

func envDuration(key string, fallback time.Duration) time.Duration {
	value, err := time.ParseDuration(os.Getenv(key))
	if err != nil || value <= 0 {
		return fallback
	}
	return value
}
