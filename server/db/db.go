package main
import (
	"database/sql"
	"log"
	"os"

	"_github.com/lib/pq"
)

func connectDB() *sql.DB{
	connStr := os.Getenv("DATABASE_URL")
	db, err := sql.Open("postgres", connStr)
	if err != nil{
		log.Fatal("Failed to open Connection:", err)
	}
	if err := db.Ping(); err != nil{
		log.Fatal("Failed to reach database:", err)
	}
	log.Println("Database connected successfully")
	return db
}