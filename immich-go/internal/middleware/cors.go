package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// CORS returns a permissive middleware matching Immich's dev defaults:
// any origin, standard verbs, and the headers the mobile SDKs send
// (Content-Type, Authorization, x-api-key). Preflights get 204 immediately.
func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		h := c.Writer.Header()
		h.Set("Access-Control-Allow-Origin", "*")
		h.Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		h.Set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key")
		h.Set("Access-Control-Max-Age", "86400")
		// Thumbnails/originals are fetched cross-origin by web clients too.
		h.Set("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}
