// Package handlers implements the HTTP layer. Every response body mirrors the
// Immich OpenAPI DTOs so stock mobile clients keep working.
package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"immich-go/config"
	"immich-go/internal/models"
	"immich-go/internal/repository"
	"immich-go/pkg/jwtutil"
)

// AuthHandler owns login/logout/validate-token endpoints.
type AuthHandler struct {
	repo   *repository.Store
	cfg    *config.Config
	secret []byte
}

// NewAuthHandler wires dependencies.
func NewAuthHandler(repo *repository.Store, cfg *config.Config) *AuthHandler {
	return &AuthHandler{repo: repo, cfg: cfg, secret: []byte(cfg.JWTSecret)}
}

// Login handles POST /api/auth/login.
// Body: {"email","password"} → 200 LoginResponseDto | 401 Immich error envelope.
func (h *AuthHandler) Login(c *gin.Context) {
	var dto models.LoginCredentialDto
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":      "Bad Request",
			"message":    "Invalid login credentials format",
			"statusCode": http.StatusBadRequest,
		})
		return
	}

	user, err := h.repo.GetUserByEmail(c.Request.Context(), dto.Email)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			// Same generic message as upstream Immich (no user enumeration).
			h.unauthorized(c, "Invalid email or password")
			return
		}
		h.internalError(c, err)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(dto.Password)); err != nil {
		h.unauthorized(c, "Invalid email or password")
		return
	}

	token, err := jwtutil.Sign(h.secret, jwtutil.Claims{
		UserID:  user.ID,
		Email:   user.Email,
		Name:    user.Name,
		IsAdmin: user.IsAdmin,
	}, h.cfg.TokenLifetime)
	if err != nil {
		h.internalError(c, err)
		return
	}

	c.JSON(http.StatusOK, models.LoginResponseDto{
		AccessToken:      token,
		UserID:           user.ID,
		UserEmail:        user.Email,
		Name:             user.Name,
		IsAdmin:          user.IsAdmin,
		ShouldChangePassword: false,
		IsOnboarded:      user.OnboardedAt != nil,
		ProfileImagePath: user.ProfileImagePath,
	})
}

// ValidateToken handles POST /api/auth/validateToken — client uses it to
// decide whether a stored JWT is still usable. Immich returns LoginResponseDto.
func (h *AuthHandler) ValidateToken(c *gin.Context) {
	uid := mustUserID(c)
	user, err := h.repo.GetUserByID(c.Request.Context(), uid)
	if err != nil {
		h.unauthorized(c, "Invalid user")
		return
	}
	c.JSON(http.StatusOK, gin.H{"accessToken": ""}) // empty token = valid session
	_ = user
}

// Status handles GET /api/auth/status (boot probe on newer apps).
func (h *AuthHandler) Status(c *gin.Context) {
	hasAdmin, err := h.repo.HasAdmin(c.Request.Context())
	if err != nil {
		h.internalError(c, err)
		return
	}
	c.JSON(http.StatusOK, models.AuthStatusDto{
		HasAdmin:      hasAdmin,
		PasswordLogin: true,
		OAuthEnabled:  false,
	})
}

// Logout handles POST /api/auth/logout — stateless JWT, always succeeds.
func (h *AuthHandler) Logout(c *gin.Context) {
	c.Status(http.StatusNoContent)
}

func (h *AuthHandler) unauthorized(c *gin.Context, msg string) {
	c.JSON(http.StatusUnauthorized, gin.H{
		"error":      "Unauthorized",
		"message":    msg,
		"statusCode": http.StatusUnauthorized,
	})
}

func (h *AuthHandler) internalError(c *gin.Context, err error) {
	gin.DefaultWriter.Write([]byte("[auth] internal error: " + err.Error() + "\n")) //nolint:errcheck
	c.JSON(http.StatusInternalServerError, gin.H{
		"error":      "Internal Server Error",
		"message":    "Unexpected server error",
		"statusCode": http.StatusInternalServerError,
	})
}
