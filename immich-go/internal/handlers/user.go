package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"immich-go/internal/middleware"
	"immich-go/internal/models"
	"immich-go/internal/repository"
)

// UserHandler serves profile endpoints.
type UserHandler struct {
	repo *repository.Store
}

// NewUserHandler wires dependencies.
func NewUserHandler(repo *repository.Store) *UserHandler {
	return &UserHandler{repo: repo}
}

// Me handles GET /api/users/me (registered also as /api/user/me for older
// app builds). Returns UserResponseDto plus an "isAdmin"-style companion via
// headers-free payload; Immich itself exposes role through /auth/status.
func (h *UserHandler) Me(c *gin.Context) {
	uid := middleware.UserIDFromContext(c)
	user, err := h.repo.GetUserByID(c.Request.Context(), uid)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Unauthorized", "message": "Invalid user", "statusCode": http.StatusUnauthorized,
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Internal Server Error", "message": "Unexpected server error", "statusCode": 500,
		})
		return
	}
	c.JSON(http.StatusOK, models.UserResponseDto{
		ID:               user.ID,
		Email:            user.Email,
		Name:             user.Name,
		AvatarColor:      user.AvatarColor,
		ProfileImagePath: user.ProfileImagePath,
		ProfileChangedAt: user.UpdatedAt,
	})
}

// meCompat answers the singular path variant used by some SDK generations.
func (h *UserHandler) Info(c *gin.Context) {
	uid := middleware.UserIDFromContext(c)
	user, err := h.repo.GetUserByID(c.Request.Context(), uid)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Unauthorized", "message": "Invalid user", "statusCode": http.StatusUnauthorized,
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"id": user.ID, "name": user.Name, "email": user.Email,
		"isAdmin": user.IsAdmin, "avatarColor": user.AvatarColor,
	})
}
