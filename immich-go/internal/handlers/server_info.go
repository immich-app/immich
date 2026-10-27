package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"immich-go/config"
	"immich-go/internal/models"
	"immich-go/internal/repository"
)

// ServerInfoHandler serves version/config/features endpoints.
type ServerInfoHandler struct {
	repo *repository.Store
	cfg  *config.Config
}

// NewServerInfoHandler wires dependencies.
func NewServerInfoHandler(repo *repository.Store, cfg *config.Config) *ServerInfoHandler {
	return &ServerInfoHandler{repo: repo, cfg: cfg}
}

// Version handles GET /api/server/version (also legacy /api/server-info/version).
// Response matches ServerVersionResponseDto exactly.
func (h *ServerInfoHandler) Version(c *gin.Context) {
	c.JSON(http.StatusOK, models.ServerVersionResponseDto{
		Major:        config.VersionMajor,
		Minor:        config.VersionMinor,
		Patch:        config.VersionPatch,
		Prerelease:   nil,
		FeatureLevel: 0,
	})
}

// Config handles GET /api/server/config — immutable static snapshot with all
// heavy features off (ML, map, OAuth …) per project spec.
func (h *ServerInfoHandler) Config(c *gin.Context) {
	c.JSON(http.StatusOK, models.ServerConfigDto{
		ExternalDomain:            "",
		LoginMessage:              "",
		OauthButtonText:           "Sign in with OAuth",
		OauthAccountManagementUrl: "",
		PublicUsers:               false,
		UserDeleteDelay:           0,
		TrashDays:                 30,
		MapLightStyleURL:          "",
		MapDarkStyleURL:           "",
		IsInitialized:             true,
		IsOnboarded:               true,
		MaintenanceMode:           false,
		MinFaces:                  1,
	})
}

// Features handles GET /api/server/features — everything disabled except
// password login and trash (cheap to support).
func (h *ServerInfoHandler) Features(c *gin.Context) {
	c.JSON(http.StatusOK, models.ServerFeaturesDto{
		ConfigFile:          false,
		FacialRecognition:   false,
		ImportFaces:         false,
		Sidecar:             false,
		Search:              false,
		OAuth:               false,
		OAuthAutoLaunch:     false,
		ReverseGeocoding:    false,
		PasswordLogin:       true,
		NotificationEmail:   false,
		Map:                 false,
		EvalSmartSearch:     false,
		DuplicateDetection:  false,
		Trash:               true,
		RealtimeTranscoding: false,
		OCR:                 false,
	})
}

// Ping handles GET /api/server/ping — some builds call this before login.
func (h *ServerInfoHandler) Ping(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"res": "pong"})
}

// About handles GET /api/server/about with the minimal shape older apps accept.
func (h *ServerInfoHandler) About(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"aboutServer": gin.H{
			"version":         config.ServerVersion,
			"buildDate":       "2026-01-01T00:00:00.000Z",
			"license":         "product",
			"expirationDate":  nil,
			"assembly":        "arm64",
			"repositoryUrl":   "https://github.com/immich-app/immich",
			"upgradeAvailable": false,
			"versionCheckState": gin.H{"source": "Offline", "checkedAt": nil},
		},
		"aboutDatabase": gin.H{"tables": []any{}, "totalTime": 0},
		"aboutBuild": gin.H{
			"dockerImage":    true,
			"buildStage":     "release",
			"sourceCommitRef": "",
			"sourceTimestamp": "2026-01-01T00:00:00.000Z",
			"major": config.VersionMajor, "minor": config.VersionMinor, "patch": config.VersionPatch,
		},
		"aboutEnv": gin.H{},
		"aboutLibraries": gin.H{"extended": []any{}},
	})
}

// Health is the unauthenticated liveness endpoint GET /api/health.
func Health(dbReady func() bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		ok := dbReady()
		status := http.StatusOK
		body := gin.H{"status": "ok", "version": config.ServerVersion}
		if !ok {
			status = http.StatusServiceUnavailable
			body = gin.H{"status": "degraded", "version": config.ServerVersion, "detail": "database unavailable"}
		}
		c.JSON(status, body)
	}
}
