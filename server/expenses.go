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
				expID, memberID, shareAmount,
			)
		}

		tx.Commit()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"id": expID})
	}
}

func handleGetExpenses(db *sql.DB) http.HandlerFunc {
	return func (w http.ResponseWriter, r *http.Request){
		groupID := chi.URLParam(r, "id")

		rows, _ := db.Query(
				`SELECT e.id, e.amount, e.currency, e.description, e.paid_by, es.user_id, es.share_amount, es.is_settled
				FROM expenses e
				JOIN expense_splits es ON es.expense_id = e.id
				WHERE e.group_id = $1
				ORDER BY e.created_at DESC`, groupID,
		)

		defer rows.Close()

		type Split struct {
		UserID string `json:"user_id"`
		ShareAmount float64 `json:"share_amount"`
		IsSettled bool `json:"is_settled"`
		}

		type Expense struct {
			ID string `json:"id"`
			Amount float64 `json:"amount"`
			Currency string `json:"currency"`
			Description string `json:"description"`
			PaidBy string `json:"paid_by"`
			Splits []Split `json:"splits"`
		}
		expenseMap := map[string]*Expense{}
		var order []string
		for rows.Next() {
			var expID, currency, description, paidBy, splitUserID string
			var amount, shareAmount float64
			var isSettled bool

			rows.Scan(&expID, &amount, &currency, &description, &paidBy, &splitUserID, &shareAmount, &isSettled)
			if _, ok := expenseMap[expID]; !ok {
				expenseMap[expID] = &Expense{
					ID: expID, Amount: shareAmount, Currency: currency,
					Description: description, PaidBy: paidBy,
				}
				order = append(order, expID)
			}
			
			expenseMap[expID].Splits = append(expenseMap[expID].Splits, Split{splitUserID, shareAmount, isSettled})
		}
		var result []*Expense
		for _, id := range order{
			result = append(result, expenseMap[id])
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(result)
	
	}
}