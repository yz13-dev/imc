package middleware

import (
	"context"
	"log"
	"net/http"

	"github.com/thecodearcher/limen"
	apiAuth "github.com/yz13-dev/imc/api/internal/auth"
	"github.com/yz13-dev/imc/api/internal/models"
)

// ШАГ 1: Объявляем приватный тип и ключ прямо здесь,
// чтобы они были недоступны извне для случайного изменения.

const userKey ctxKey = "user"

// ШАГ 2: Пишем саму middleware
func UserInstance(auth *limen.Limen) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

			user, err := apiAuth.GetUser(r.Context(), r.Cookies())

			log.Println("user", user, err)

			// user, err := auth.GetSession(r)
			var ctx context.Context
			if err != nil {
				ctx = context.WithValue(r.Context(), userKey, nil)
			} else {
				ctx = context.WithValue(r.Context(), userKey, user)
			}
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// Полезный бонус: Хелпер для получения DB в обработчиках (handlers)
func GetUser(ctx context.Context) (*models.User, bool) {
	resp, ok := ctx.Value(userKey).(*apiAuth.GetUserResponse)

	if resp == nil {
		return nil, false
	}
	user := resp.User

	return &user, ok
}

func GetSession(ctx context.Context) (*models.Session, bool) {
	resp, ok := ctx.Value(userKey).(*apiAuth.GetUserResponse)

	if resp == nil {
		return nil, false
	}

	session := resp.Session

	return &session, ok
}
