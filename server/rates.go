package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
)

//Exchange rate caching from API stored rates
func handleGetRates(db *sql.DB) http.HandlerFunc {
	return func (w http.ResponseWriter, r *http.Request){
		rows, err := db.Query(
			"SELECT target_currency, rate FROM exchange_rates WHERE base_currency = 'USD'",
		)
		if err != nil {
			http.Error(w, "Server error!", 500)
			return
		}
		defer rows.Close()

		rates := map[string]float64{}
		for rows.Next(){
			var target string
			var rate float64
			rows.Scan(&target, &rate)
			rates[target] = rate
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(rates)
	}
}