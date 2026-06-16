package middleware

import (
	"context"
	"net/http"

	"gorm.io/gorm"
)

// ШАГ 1: Объявляем приватный тип и ключ прямо здесь,
// чтобы они были недоступны извне для случайного изменения.
type ctxKey string

const dbKey ctxKey = "gormDB"

// ШАГ 2: Пишем саму middleware
func DBInstance(db *gorm.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), dbKey, db)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// Полезный бонус: Хелпер для получения DB в обработчиках (handlers)
func GetDB(ctx context.Context) (*gorm.DB, bool) {
	db, ok := ctx.Value(dbKey).(*gorm.DB)
	return db, ok
}
