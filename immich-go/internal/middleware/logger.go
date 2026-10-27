// Package middleware contains Gin HTTP middleware: async request logging,
// CORS and JWT authentication.
package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
)

// logRecord is one line of access-log data handed to the async writer.
type logRecord struct {
	method string
	path   string
	status int
	latency time.Duration
	size   int
}

// Logger returns a Gin middleware that measures each request and pushes the
// record onto a buffered channel; a single background goroutine drains it so
// hot paths never block on I/O. /health requests are skipped entirely.
func Logger() gin.HandlerFunc {
	ch := make(chan logRecord, 1024)

	// Async writer goroutine — exits when the process does.
	go func() {
		for r := range ch {
			// Minimal format, no timestamp overhead per spec.
			// Sprintf-free fast path via string concat keeps allocations low.
			printRecord(r)
		}
	}()

	return func(c *gin.Context) {
		if c.Request.URL.Path == "/api/health" || c.Request.URL.Path == "/health" {
			c.Next()
			return
		}
		start := time.Now()
		c.Next()
		rec := logRecord{
			method:  c.Request.Method,
			path:    c.Request.URL.Path,
			status:  c.Writer.Status(),
			latency: time.Since(start),
			size:    c.Writer.Size(),
		}
		select {
		case ch <- rec: // non-blocking: drop logs if the pipe backs up
		default:
		}
	}
}

func printRecord(r logRecord) {
	// e.g.: GET /api/assets 200 3.4ms 1024
	gin.DefaultWriter.Write( //nolint:errcheck // logging must never fail the request
		[]byte(r.method + " " + r.path + " " + itoa(r.status) + " " +
			r.latency.Round(time.Microsecond).String() + " " + itoa(r.size) + "\n"),
	)
}

// itoa avoids strconv import cost for tiny ints (status codes/sizes fit fine).
func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	var buf [20]byte
	i := len(buf)
	neg := n < 0
	if neg {
		n = -n
	}
	for n > 0 {
		i--
		buf[i] = byte('0' + n%10)
		n /= 10
	}
	if neg {
		i--
		buf[i] = '-'
	}
	return string(buf[i:])
}
