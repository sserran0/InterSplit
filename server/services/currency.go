package main
import (
	"database/sql"
	"net/http"
	"encoding/json"
	"log"
	"time"
)

type frankfurterResponse struct {
	Rates map[string]float64 `json:"rates"`
}

func refreshRates(db *sql.DB) error {
	resp, err := http.Get(
		"https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,KRW,JPY,MXN,CNY,AUD,CAD,BRL,INR,THB,VND,SGD",

	)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var result frankfurterResponse 
	json.NewDecoder(resp,Body).Decode(&result)

	for target, rate := range result.Rates {
		db.Exec (
			`INSERT INTO exchange_rates (base_currency, target_currency, rate, fetched_at)
			VALUES ('USD', $1, $2, NOW())
			ON CONFLICT (base_currency, target_currency)
			DO UPDATE SET rate = EXCLUDED.rate, fetched_at = NOW()`,
			target,rate,
		)
	}

	log.Printf("Exchange rates refreshed! - %d currencies cached", len(result.Rates))
	return nil
}

//Rate refreshed every hour, 14 currency rates including base
func startRateRefresher(db *sql.DB) {
	refreshRates(db)
	go func() {
		ticker := time.NewTicker(1*time.Hour)
		for range ticker.C {
			if err := refreshRates(db); err != nil {
				log.Println("Failed to refresh rates:", err)
			}
		}
	}()
}