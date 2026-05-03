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


	files, _ := filepath.Glob("migrations/*.sql")
	log.Printf("Found migration files: %v", files)
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
		result, err := db.Exec(string(content))
		if err != nil {
			log.Printf("Migration error in %s: %v", name, err)
			continue
		}
log.Printf("Applied migration: %s, result: %v", name, result)
		db.Exec(string(content))
		db.Exec("INSERT INTO migrations_run (filename) VALUES ($1)", name)
		log.Printf("Applied migration: %s", name)
	}
	return nil
}