package main

import(
	"database/sql"
	"encoding/json"
	"net/http"
	"github.com/go-chi/chi/v5"
)

type CreateExpenseRequest struct {
	GroupID string `json:"group_id"`
	Amount float64 `json:"amount"`
	Currency string `json:"currency"`
	Description string `json:"description"`
	MemberIDs []string `json:"member_ids"`
}

func handleCreateExpense(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request){
		userID := r.Context().Value("userID").(string)
		var req CreateExpenseRequest
		json.NewDecoder(r.Body).Decode(&req)

		shareAmount := req.Amount / float64(len(req.MemberIDs))

		tx, err := db.Begin()
		if err != nil{
			http.Error(w, "Server error", 500)
			return
		}

		var expID string
		tx.QueryRow(
			`INSERT INTO expenses (group_id, paid_by, amount, currency, description)
			VALUES ($1, $2, $3, $4, $5) RETURNING id`,
			req.GroupID, userID, req.Amount, req.Currency, req.Description,
		).Scan(&expID)

		for _, memberID := range req.MemberIDs{
			tx.Exec(
				"INSERT INTO expense_splits (expense_id, user_id, share_amount) VALUES ($1, $2, $3)",
				expID, memberID, sharedAmount,
			)
		}

		tx.Commit()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"id": expID})
	}
}