package handlers

import (
	"github.com/gin-gonic/gin"

	"immich-go/internal/middleware"
)

// mustUserID extracts the authenticated user id set by Auth middleware.
// Handlers call it only behind the auth guard, so an empty value is a bug,
// not user input; still we never panic — callers check for "" themselves.
func mustUserID(c *gin.Context) string {
	return middleware.UserIDFromContext(c)
}
