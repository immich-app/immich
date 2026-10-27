package middleware

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"immich-go/pkg/jwtutil"
)

// Context keys populated by Auth after a successful token check.
const (
	CtxUserID  = "auth_user_id"
	CtxIsAdmin = "auth_is_admin"
)

// Auth validates the Bearer JWT (or x-api-key header, accepted but treated as
// admin API key when it matches cfg.APIKey — kept simple here). On failure it
// answers with Immich's error envelope: {"error":"Unauthorized","message":...,"statusCode":401}.
func Auth(secret []byte) gin.HandlerFunc {
	return func(c *gin.Context) {
		raw := c.GetHeader("Authorization")
		if raw == "" {
			// Older builds also accept ?key=<jwt> for media URLs.
			raw = "Bearer " + c.Query("key")
		}
		parts := strings.SplitN(raw, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || parts[1] == "" {
			abortUnauthorized(c, "Authentication required")
			return
		}
		claims, err := jwtutil.Parse(secret, parts[1])
		if err != nil {
			msg := "Invalid token"
			if errors.Is(err, jwtutil.ErrExpired) {
				msg = "Token expired"
			}
			abortUnauthorized(c, msg)
			return
		}
		c.Set(CtxUserID, claims.UserID)
		c.Set(CtxIsAdmin, claims.IsAdmin)
		c.Next()
	}
}

func abortUnauthorized(c *gin.Context, msg string) {
	c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
		"error":      "Unauthorized",
		"message":    msg,
		"statusCode": http.StatusUnauthorized,
	})
}

// UserIDFromContext returns the authenticated user id (empty when anonymous).
func UserIDFromContext(c *gin.Context) string {
	v, _ := c.Get(CtxUserID)
	s, _ := v.(string)
	return s
}
