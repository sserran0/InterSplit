package main

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type CreateGroupRequest struct {
	Name string `json:"name"`
}
//Group Gather
func handleGetGroups(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request){
		userID := r.Context().Value("userID").(string)
		//userID access through jwtMiddleware storage

		rows, err := db.Query(
			`SELECT g.id, g.name, g.created_at
			FROM groups g
			JOIN group_members gm ON gm.group_id = g.id
			WHERE gm.user_id = $1`, userID,
		)
		if err != nil{
			http.Error(w, "Server error", 500)
			return
		}
		defer rows.Close()

		type Group struct {
			ID string `json:"id"`
			Name string `json:"name"`
		}
		var groups []Group
		for rows.Next() {
			var g Group
			var createdAt interface{}
			rows.Scan(&g.ID, &g.Name, &createdAt)
			groups = append(groups, g)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(groups)
	}
}
//Group Creation
func handleCreateGroup(db *sql.DB) http.HandlerFunc {
	return func (w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value("userID").(string)
		var req CreateGroupRequest
		json.NewDecoder(r.Body).Decode(&req)

		var groupID string
		db.QueryRow(
			"INSERT INTO groups (name, created_by) VALUES ($1, $2) RETURNING id", req.Name, userID,
		).Scan(&groupID)

		db.Exec(
			"INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)",
			groupID, userID,
		)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"id": groupID})
	}

}
//Join Group
func handleJoinGroup(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request){
		userID := r.Context().Value("userID").(string)
		groupID := chi.URLParam(r, "id")

		db.Exec(
		"INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
		groupID, userID,
		)
		w.WriteHeader(http.StatusOK)
	}
}