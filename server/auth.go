package main 
import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
	"unicode/utf8"

	"golang.org/x/crypto/bcrypt"
)

type RegisterRequest struct {
	Email string `json:"email"`
	Name string `json:"name"`
	Password string `json:"password"`
	PreferredCurrency string `json:"preferred_currency"`

}

type LoginRequest struct{
	Email string `json:"email"`
	Password string `json:"password"`	
}

func validateRegister(req RegisterRequest) string{
	if strings.TrimSpace(req.Email) == ""{
		return "Email is required!"
	}
	if !strings.Contains(req.Email, "@"){
		return "Invalid email format!"
	}
	if strings.TrimSpace(req.Name) == ""{
		return "Name is required!"
	}
	if utf8.RuneCountInString(req.Password) < 8 {
		return "Password must be at least 8 characters!"
	}
	if len(req.PreferredCurrency) != 3{
		return "preferred_currency must be a 3-letter currency code!"
	}

	return ""
}


func handleRegister(db *sql.DB) http.HandlerFunc{
	return func(w http.ResponseWriter, r *http.Request){
		var req RegisterRequest
		json.NewDecoder(r.Body).Decode(&req)

		req.Email = strings.TrimSpace(strings.ToLower(req.Email))
		req.Name = strings.TrimSpace(req.Name)
		req.PreferredCurrency = strings.ToUpper(strings.TrimSpace(req.PreferredCurrency))

		if errMsg := validateRegister(req); errMsg != ""{
			http.Error(w, errMsg, 400)
			return
		}

		hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
		if err != nil{
			http.Error(w, "server error", 500)
			return
		}

		var userID string
		err = db.QueryRow(
			`INSERT INTO users (email, name, password_hash, preferred_currency)
			VALUES ($1, $2, $3, $4) RETURNING id`,
			req.Email, req.Name, string(hash), req.PreferredCurrency,
		).Scan(&userID)
		if err != nil {
			http.Error(w, "email already exists", 400)
			return
		}
		token, _ := generateToken(userID)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"token": token, "user_id" : userID})
	}
}

func handleLogin(db *sql.DB) http.HandlerFunc{
	return func (w http.ResponseWriter, r *http.Request){
		var req LoginRequest
		json.NewDecoder(r.Body).Decode(&req)

		req.Email = strings.TrimSpace(strings.ToLower(req.Email))
		if req.Email == "" || req.Password == ""{
			http.Error(w, "Email and Password as required!", 400)
			return
		}

		var userID, hash string
		err := db.QueryRow(
			"SELECT id, password_hash FROM users WHERE email=$1", req.Email,
		).Scan(&userID, &hash)
		if err != nil{
			http.Error(w, "invalid credentials", 401)
			return 
		}

		if bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)) != nil {
			http.Error(w, "invalid credentials", 401)
			return 
		}

		token, _ := generateToken(userID)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"token": token, "user_id": userID})
	}
}
