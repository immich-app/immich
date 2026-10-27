package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"immich-go/internal/middleware"
	"immich-go/internal/models"
	"immich-go/internal/repository"
)

// List handles GET /api/assets with Immich's timeline query parameters:
//   take, skip, isFavorite, isArchived, isTrashed, type, order, orderBy.
//
// Response: plain JSON array of AssetResponseDto (newer SDKs read the body
// directly; older ones rely on the X-Total-Count header for pagination).
func (h *AssetHandler) List(c *gin.Context) {
	userID := mustUserID(c)

	q := c.Query
	take := atoiDefault(q("take"), 500)
	skip := atoiDefault(q("skip"), 0)

	f := repository.AssetFilter{
		UserID:  userID,
		Take:    take,
		Skip:    skip,
		Type:    normalizeType(q("type")),
		OrderBy: q("orderBy"),
		Order:   q("order"),
	}
	if v, ok := parseBool(q("isFavorite")); ok {
		f.IsFavorite = &v
	}
	if v, ok := parseBool(q("isArchived")); ok {
		f.IsArchived = &v
	}
	if v, ok := parseBool(q("isTrashed")); ok {
		f.IsTrashed = &v
	}

	assets, total, err := h.repo.ListAssets(c.Request.Context(), f)
	if err != nil {
		c.JSON(http.StatusInternalServerError, immichErr(500, "Failed to list assets"))
		return
	}

	out := make([]models.AssetResponseDto, 0, len(assets))
	for _, a := range assets {
		out = append(out, toAssetResponse(a))
	}

	c.Header("X-Total-Count", strconv.Itoa(total))
	c.JSON(http.StatusOK, out)
}

// GetOne handles GET /api/assets/:id — full detail incl. EXIF block.
func (h *AssetHandler) GetOne(c *gin.Context) {
	a, err := h.repo.GetAsset(c.Request.Context(), c.Param("id"))
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			c.JSON(http.StatusNotFound, immichErr(404, "Asset not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, immichErr(500, "Failed to load asset"))
		return
	}
	// Ownership check: only the owner (or an admin) may read raw rows.
	uid := middleware.UserIDFromContext(c)
	isAdmin, _ := c.Get(middleware.CtxIsAdmin)
	if a.UserID != uid && isAdmin != true {
		c.JSON(http.StatusForbidden, immichErr(403, "Insufficient permissions for this asset"))
		return
	}
	c.JSON(http.StatusOK, toAssetResponse(a))
}

// ---------------------------------------------------------------------------
// param helpers
// ---------------------------------------------------------------------------

func atoiDefault(s string, def int) int {
	if s == "" {
		return def
	}
	n, err := strconv.Atoi(s)
	if err != nil || n < 0 {
		return def
	}
	return n
}

// parseBool accepts Immich/Dart encodings: true/false/1/0/"yes".
func parseBool(s string) (bool, bool) {
	switch s {
	case "":
		return false, false
	case "true", "1":
		return true, true
	case "false", "0":
		return false, true
	}
	return false, false
}

func normalizeType(t string) string {
	switch t {
	case "image", "IMAGE":
		return "IMAGE"
	case "video", "VIDEO":
		return "VIDEO"
	}
	return ""
}
