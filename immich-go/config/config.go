// Package config loads all runtime configuration from environment variables,
// with sane defaults tuned for low-resource SBCs (ODROID-C2, ARM64, 2GB RAM).
package config

import (
	"log"
	"os"
	"strconv"
	"time"
)

// ServerVersion is reported by the API. It mimics an Immich server so that
// official mobile clients accept the response (major/minor/patch).
const (
	ServerVersion = "1.100.0"
	VersionMajor  = 1
	VersionMinor  = 100
	VersionPatch  = 0
)

// Config holds every tunable knob of the server.
type Config struct {
	// HTTP
	Port            int           // listen port (default 2283, same as Immich)
	ReadTimeout     time.Duration // header+body read deadline
	WriteTimeout    time.Duration // response write deadline (streaming uses no timeout on hijacked conns)
	RequestTimeout  time.Duration // overall per-request context deadline

	// Storage
	DataDir     string // root data directory (default /data)
	DatabasePath string // SQLite file (default $DataDir/immich.db)
	PhotosDir   string // $DataDir/photos
	ThumbsDir   string // $DataDir/thumbnails
	EncodedDir  string // $DataDir/encoded

	// Auth
	JWTSecret      string        // HS256 signing secret
	TokenLifetime  time.Duration // JWT expiry (default 30 days)

	// Database tuning for WAL mode on slow eMMC storage
	MaxConns     int           // max open connections in pool (default 5)
	BusyTimeout  time.Duration // sqlite busy_timeout pragma

	// Background compression worker
	WorkerInterval    time.Duration // polling tick (default 30s)
	WorkerCPUBudget   time.Duration // sleep added after each batch to keep CPU < ~20%
	MaxImageWidth     int           // downscale photos wider than this (default 2048)
	JPEGQuality       int           // re-encode quality (default 80)
	ImageWorkers      int           // concurrent resize goroutines (default 2)

	// Memory guard (bytes). When runtime.MemStats.HeapAlloc exceeds this,
	// caches are evicted aggressively. Default 500MB.
	MemoryLimit uint64
}

// getenv reads an env var with a fallback default.
func getenv(key, def string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return def
}

// Load builds a Config from environment variables. Invalid numeric values
// fall back to defaults with a warning instead of crashing the process.
func Load() *Config {
	c := &Config{}

	c.Port = envInt("IMMICHGO_PORT", 2283)
	c.ReadTimeout = envDur("IMMICHGO_READ_TIMEOUT", 30*time.Second)
	c.WriteTimeout = envDur("IMMICHGO_WRITE_TIMEOUT", 0) // 0 = no write timeout (video streaming)
	c.RequestTimeout = envDur("IMMICHGO_REQUEST_TIMEOUT", 5*time.Minute)

	c.DataDir = getenv("IMMICHGO_DATA_DIR", "/data")
	c.DatabasePath = getenv("IMMICHGO_DB_PATH", c.DataDir+"/immich.db")
	c.PhotosDir = getenv("IMMICHGO_PHOTOS_DIR", c.DataDir+"/photos")
	c.ThumbsDir = getenv("IMMICHGO_THUMBS_DIR", c.DataDir+"/thumbnails")
	c.EncodedDir = getenv("IMMICHGO_ENCODED_DIR", c.DataDir+"/encoded")

	c.JWTSecret = getenv("IMMICHGO_JWT_SECRET", "change-me-in-production")
	if c.JWTSecret == "change-me-in-production" {
		log.Println("[config] WARNING: using default JWT secret; set IMMICHGO_JWT_SECRET in production")
	}
	c.TokenLifetime = envDur("IMMICHGO_TOKEN_LIFETIME", 30*24*time.Hour)

	c.MaxConns = envInt("IMMICHGO_DB_MAX_CONNS", 5)
	c.BusyTimeout = envDur("IMMICHGO_DB_BUSY_TIMEOUT", 5*time.Second)

	c.WorkerInterval = envDur("IMMICHGO_WORKER_INTERVAL", 30*time.Second)
	c.WorkerCPUBudget = envDur("IMMICHGO_WORKER_SLEEP", 2*time.Second)
	c.MaxImageWidth = envInt("IMMICHGO_MAX_IMAGE_WIDTH", 2048)
	c.JPEGQuality = envInt("IMMICHGO_JPEG_QUALITY", 80)
	c.ImageWorkers = envInt("IMMICHGO_IMAGE_WORKERS", 2)

	c.MemoryLimit = uint64(envInt64("IMMICHGO_MEMORY_LIMIT_MB", 500)) * 1024 * 1024

	return c
}

func envInt(key string, def int) int {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		n, err := strconv.Atoi(v)
		if err != nil {
			log.Printf("[config] invalid %s=%q, using default %d", key, v, def)
			return def
		}
		return n
	}
	return def
}

func envInt64(key string, def int64) int64 {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		n, err := strconv.ParseInt(v, 10, 64)
		if err != nil {
			log.Printf("[config] invalid %s=%q, using default %d", key, v, def)
			return def
		}
		return n
	}
	return def
}

func envDur(key string, def time.Duration) time.Duration {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		d, err := time.ParseDuration(v)
		if err != nil {
			log.Printf("[config] invalid %s=%q, using default %v", key, v, def)
			return def
		}
		return d
	}
	return def
}
