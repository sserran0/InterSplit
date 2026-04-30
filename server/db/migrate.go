package main
import (
	"database/sql"
	"log"
	"os"
	"path/filepath"
	"sort"
)

func runMigrations(db *sql.DB) error {
	db.Exec(`CREATE TABLE IF NOT EXISTS migrations_run (
			filename TEXT PRIMARY KEY,
			applied_at TIMESTAMPTZ DEFAULT NOW()
	)`)


	files, _ := filepath.Glob("db/migrations/*.sql")
	sort.Strings(files)

	for _, f := range files {
		name := filepath.Base(f)
		var exists bool 
		db.QueryRow(
			"SELECT EXISTS(SELECT 1 FROM migrations_run WHERE filename=$1)",
			name,
		).Scan(&exists)
		if exists{
			continue
		}
		content, _ := os.ReadFile(f)
		db.Exec(string(content))
		db.Exec("INSERT INTO migrations_run (filename) VALUES ($1)", name)
		log.Printf("Applied migration: %s", name)
	}
	return nil
}