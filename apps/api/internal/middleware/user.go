package middleware

import (
	"context"
	"net/http"

	"github.com/thecodearcher/limen"
)

// ШАГ 1: Объявляем приватный тип и ключ прямо здесь,
// чтобы они были недоступны извне для случайного изменения.

const userKey ctxKey = "user"

// ШАГ 2: Пишем саму middleware
func UserInstance(auth *limen.Limen) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user, err := auth.GetSession(r)
			var ctx context.Context
			if err != nil {
				ctx = context.WithValue(r.Context(), userKey, nil)
			} else {
				ctx = context.WithValue(r.Context(), userKey, user.User)
			}
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// Полезный бонус: Хелпер для получения DB в обработчиках (handlers)
func GetUser(ctx context.Context) (*limen.User, bool) {
	user, ok := ctx.Value(userKey).(*limen.User)
	return user, ok
}
