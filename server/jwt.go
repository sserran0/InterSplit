package main 

import (
	"context"
	"net/http"
	"os"
	"strings"
	"time"
	"log"
	"github.com/golang-jwt/jwt/v5"
)

func generateToken (userId string) (string, error){
	claims := jwt.MapClaims{
		"sub": userId,
		"exp": time.Now().Add(7 * 24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

func jwtMiddleware(next http.Handler) http.Handler{
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request){
		tokenStr := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
		token, err := jwt.Parse(tokenStr, func (token *jwt.Token) (interface{}, error){
			return []byte(os.Getenv("JWT_SECRET")), nil
		})
		if err != nil || !token.Valid{
			http.Error(w, "unauthorized", 401)
			return
		}
		ctx := context.WithValue(r.Context(), "userID", token.Claims.(jwt.MapClaims)["sub"])
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}