// Package main is the entry point of the Immich-compatible Go server.
//
// Boot sequence: config → SQLite (WAL) → optional bootstrap admin → Gin router
// with CORS/logging/auth → background compression worker → graceful shutdown.
package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"immich-go/config"
	"immich-go/internal/database"
	"immich-go/internal/handlers"
	"immich-go/internal/middleware"
	"immich-go/internal/models"
	"immich-go/internal/repository"
	"immich-go/internal/services"
)

func main() {
	cfg := config.Load()

	// Quiet Gin for production; debug output only when explicitly requested.
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.ReleaseMode)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// --- storage dirs --------------------------------------------------------
	for _, d := range []string{cfg.DataDir, cfg.PhotosDir, cfg.ThumbsDir, cfg.EncodedDir} {
		if err := os.MkdirAll(d, 0o750); err != nil {
			log.Fatalf("fatal: cannot create %s: %v", d, err)
		}
	}

	// --- database ------------------------------------------------------------
	db, err := database.Open(ctx, cfg.DatabasePath, cfg.MaxConns, cfg.BusyTimeout)
	if err != nil {
		log.Fatalf("fatal: database: %v", err)
	}
	defer db.Close()
	repo := repository.New(db)

	// First-run convenience: if IMMICHGO_ADMIN_EMAIL/PASSWORD are set and no
	// users exist yet, create the initial admin so the mobile app can log in.
	if err := bootstrapAdmin(ctx, repo); err != nil {
		log.Printf("warning: admin bootstrap failed: %v", err)
	}

	// --- handlers & router ----------------------------------------------------
	authH := handlers.NewAuthHandler(repo, cfg)
	infoH := handlers.NewServerInfoHandler(repo, cfg)
	userH := handlers.NewUserHandler(repo)
	assetH := handlers.NewAssetHandler(repo, cfg)
	albumH := handlers.NewAlbumHandler(repo)

	r := gin.New()
	r.Use(middleware.Logger(), middleware.CORS(), gin.Recovery())

	// Public endpoints (no auth): health + version ping used before login.
	r.GET("/api/health", handlers.Health(func() bool { return db.Ping() == nil }))
	r.GET("/health", handlers.Health(func() bool { return db.Ping() == nil }))

	api := r.Group("/api")
	{
		// Auth group — public.
		auth := api.Group("/auth")
		{
			auth.POST("/login", authH.Login)
			auth.POST("/logout", authH.Logout)
			auth.GET("/status", authH.Status)
			// validateToken needs identity if provided → put behind guard but
			// tolerate missing user gracefully inside handler.
			auth.POST("/validateToken", middleware.Auth([]byte(cfg.JWTSecret)), authH.ValidateToken)
		}

		// Server info — public (Immich exposes these pre-login too).
		api.GET("/server/version", infoH.Version)
		api.GET("/server/config", infoH.Config)
		api.GET("/server/features", infoH.Features)
		api.GET("/server/ping", infoH.Ping)
		api.GET("/server/about", infoH.About)
		// Legacy aliases from the spec sketch (older app builds):
		api.GET("/server-info/version", infoH.Version)
		api.GET("/server-info/config", infoH.Config)

		// Everything below requires a valid Bearer JWT.
		priv := api.Group("")
		priv.Use(middleware.Auth([]byte(cfg.JWTSecret)))
		{
			// User profile — both path spellings for SDK compatibility.
			priv.GET("/users/me", userH.Me)
			priv.GET("/user/me", userH.Me)
			priv.GET("/users/me/info", userH.Info) // older /user-info style probe

			// Assets.
			priv.POST("/assets", assetH.Upload)
			priv.GET("/assets", assetH.List)
			priv.GET("/assets/:id", assetH.GetOne)
			priv.GET("/assets/:id/thumbnail", assetH.Thumbnail)
			priv.GET("/assets/:id/original", assetH.Original)
			priv.GET("/assets/:id/download", assetH.Original)

			// Albums.
			priv.POST("/albums", albumH.Create)
			priv.GET("/albums", albumH.List)
			priv.GET("/albums/:id", albumH.Get)
			priv.PUT("/albums/:id/assets", albumH.AddAssets)
			priv.DELETE("/albums/:id/assets", albumH.RemoveAssets)
		}
	}

	srv := &http.Server{
		Addr:           fmt.Sprintf("0.0.0.0:%d", cfg.Port),
		Handler:        r,
		ReadTimeout:    cfg.ReadTimeout,
		WriteTimeout:   cfg.WriteTimeout, // 0 → streaming-friendly
		MaxHeaderBytes: 1 << 20,          // 1MB headers plenty for mobile SDK
	}

	// --- background worker ----------------------------------------------------
	worker := services.NewCompressionWorker(repo, cfg)
	go worker.Run(ctx)

	// --- serve + graceful shutdown -------------------------------------------
	serverErr := make(chan error, 1)
	go func() {
		log.Printf("immich-go v%s listening on :%d (data=%s)", config.ServerVersion, cfg.Port, cfg.DataDir)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErr <- err
		}
	}()

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	select {
	case err := <-serverErr:
		log.Fatalf("fatal: listen: %v", err)
	case s := <-sig:
		log.Printf("received %s, shutting down…", s)
	}

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer shutdownCancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("graceful shutdown incomplete: %v", err)
	}
	cancel() // stop the worker
	log.Println("bye")
}

// bootstrapAdmin creates the first admin account when env vars are supplied
// and the users table is still empty. Passwords are bcrypt-hashed exactly the
// way upstream Immich stores them, so legacy hashes remain compatible.
func bootstrapAdmin(ctx context.Context, repo *repository.Store) error {
	email := os.Getenv("IMMICHGO_ADMIN_EMAIL")
	pass := os.Getenv("IMMICHGO_ADMIN_PASSWORD")
	if email == "" || pass == "" {
		return nil
	}
	hasAdmin, err := repo.HasAdmin(ctx)
	if err != nil {
		return err
	}
	if hasAdmin {
		return nil
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(pass), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	name := os.Getenv("IMMICHGO_ADMIN_NAME")
	if name == "" {
		name = "Admin"
	}
	u := &models.User{
		ID:          uuid.NewString(),
		Email:       email,
		Password:    string(hash),
		Name:        name,
		AvatarColor: "blue",
		IsAdmin:     true,
	}
	if err := repo.InsertUser(ctx, u); err != nil {
		return err
	}
	log.Printf("bootstrap: created admin user %s", email)
	return nil
}
