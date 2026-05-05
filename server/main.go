package main

import (
	"log"
	"os"
    "net/http"
    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
    "github.com/joho/godotenv"
)
func main() {
	godotenv.Load()
    db := connectDB()   
    runMigrations(db)
	startRateRefresher(db)

    r := chi.NewRouter()
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)
    r.Use(corsMiddleware)  

    r.Route("/api", func(r chi.Router) {
        r.Post("/auth/register", handleRegister(db))
        r.Post("/auth/login",    handleLogin(db))

        r.Group(func(r chi.Router) {
            r.Use(jwtMiddleware)  // protected routes
            r.Get("/groups",             handleGetGroups(db))
            r.Post("/groups",            handleCreateGroup(db))
            r.Post("/groups/{id}/join",  handleJoinGroup(db))
			r.Get("/groups/{id}/members", handleGetGroupMembers(db))
			r.Post("/groups/{id}/members", handleAddMember(db))
			r.Delete("/groups/{id}/members/{memberID}", handleRemoveMember(db))
            r.Post("/expenses",          handleCreateExpense(db))
            r.Get("/groups/{id}/expenses", handleGetExpenses(db))
            r.Get("/rates",              handleGetRates(db))
			
        })
    })
	port := os.Getenv("PORT")
	log.Printf("Server running on port %s", port)
    http.ListenAndServe(":"+port, r)
}
