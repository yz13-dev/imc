package models

type User struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}
type Session struct {
	ID     string `json:"id"`
	UserId string `json:"userId"`
}
