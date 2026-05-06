package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"

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

//get members
func handleGetGroupMembers(db *sql.DB) http.HandlerFunc {
	return func ( w http.ResponseWriter, r *http.Request){
		groupID := chi.URLParam(r, "id")

		rows, err := db.Query (
			`SELECT u.id, u.name, u.preferred_currency 
			 FROM users u 
			 JOIN group_members gm ON gm.user_id = u.id
			 WHERE gm.group_id = $1`, groupID,
		)

		if err != nil {
			http.Error(w, "Server error", 500)
			return
		}
		defer rows.Close()

		type Member struct {
			ID string `json:"id"`
			Name string `json:"name"`
			PreferredCurrency string `json:"preferred_currency"`
		}

		var members []Member
		for rows.Next() {
			var m Member 
			rows.Scan(&m.ID, &m.Name, &m.PreferredCurrency)
			members = append(members, m)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(members)
	}
}
func handleAddMember(db *sql.DB) http.HandlerFunc {
	return func (w http.ResponseWriter, r *http.Request){
		groupID := chi.URLParam(r, "id")
		creatorID := r.Context().Value("userID").(string)

		var body struct {
			Name string `json:"name"`
			PreferredCurrency string `json:"preferred_currency"`
		}
		json.NewDecoder(r.Body).Decode(&body)

		if body.Name == "" || len(body.PreferredCurrency) != 3 {
			http.Error(w, "Name + Currency Required!", 400)
			return
		}
		guestEmail := strings.ToLower(body.Name) + "@" + groupID[:8] + ".guest.intersplit"

		var userID string
		err := db.QueryRow (
			`INSERT INTO users (email, name, password_hash, preferred_currency)
			values ($1, $2, $3, $4) RETURNING id`,
			guestEmail, body.Name, "guest", body.PreferredCurrency,
		).Scan(&userID)

		if err != nil {
			db.QueryRow(
				"SELECT id FROM users WHERE email = $1",
				guestEmail,
			).Scan(&userID)
		}
		db.Exec(
			"INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
			groupID, userID,
		)

		db.Exec(
			"INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
			groupID, creatorID,
		)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"id": userID, "name": body.Name})
	}
}

func handleRemoveMember(db *sql.DB) http.HandlerFunc{
	return func (w http.ResponseWriter, r *http.Request){
		groupID := chi.URLParam(r,"id")
		memberID := chi.URLParam(r, "memberID")
		callerID := r.Context().Value("userID").(string)
		
		//deny removal if group only has one member (you)
		var count int 
		db.QueryRow(
			"SELECT COUNT(*) FROM group_members WHERE group_id = $1", groupID,
		).Scan(&count)
		if count <= 1{
			http.Error(w, "Group Must Have At Least One Member!", 400)
			return
		}

		//only allow self removal if you create group
		if memberID != callerID {
			var createdBy string
			db.QueryRow(
				"SELECT created_by FROM groups WHERE id = $1", groupID,
			).Scan(&createdBy)
			if createdBy != callerID{
				http.Error(w, "Unauthorized!", 401)
				return
			}
		}
		//member removal
		db.Exec(
			"DELETE FROM group_members WHERE group_id = $1 AND user_id = $2",
			groupID, memberID,
		)

		db.Exec(
			"DELETE FROM users WHERE id = $1", memberID,
		)
		w.WriteHeader(http.StatusOK)
	}
}

func handleDeleteGroup(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request){
		groupID := chi.URLParam(r, "id")

		var createdBy string
		err := db.QueryRow(
			"SELECT created_by FROM groups WHERE id = $1", groupID,
		).Scan(&createdBy)

		if err != nil {
			http.Error(w, "Group Not Found", 404)
		}

		db.Exec("DELETE FROM groups WHERE id=$1", groupID)
		w.WriteHeader(http.StatusOK)
	}
}