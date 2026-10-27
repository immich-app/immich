package handlers

import (
	"errors"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"

	"immich-go/internal/repository"
)

// Thumbnail serves GET /api/assets/:id/thumbnail.
// Falls back to the original when the background worker hasn't produced a
// thumbnail yet — mobile clients always get *some* image instead of an error.
func (h *AssetHandler) Thumbnail(c *gin.Context) {
	a, err := h.repo.GetAsset(c.Request.Context(), c.Param("id"))
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			c.JSON(http.StatusNotFound, immichErr(404, "Asset not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, immichErr(500, "Failed to load thumbnail"))
		return
	}

	path := a.OriginalPath
	if a.ResizePath != nil && *a.ResizePath != "" {
		path = *a.ResizePath
	}
	fi, statErr := os.Stat(path)
	if statErr != nil {
		c.JSON(http.StatusNotFound, immichErr(404, "Thumbnail file missing"))
		return
	}

	// Aggressive caching: thumbnails are immutable per asset id.
	c.Header("Cache-Control", "public, max-age=31536000, immutable")
	c.Header("Content-Type", contentTypeFor(path))
	http.ServeFile(c.Writer, c.Request, path)
	_ = fi
}

// Original serves GET /api/assets/:id/original and honours Range requests so
// the iOS/Android players can seek inside videos without downloading all of
// them (http.ServeContent implements 206 Partial Content natively).
func (h *AssetHandler) Original(c *gin.Context) {
	a, err := h.repo.GetAsset(c.Request.Context(), c.Param("id"))
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			c.JSON(http.StatusNotFound, immichErr(404, "Asset not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, immichErr(500, "Failed to load asset"))
		return
	}

	f, err := os.Open(a.OriginalPath)
	if err != nil {
		c.JSON(http.StatusNotFound, immichErr(404, "Original file missing on disk"))
		return
	}
	defer f.Close()

	fi, err := f.Stat()
	if err != nil {
		c.JSON(http.StatusInternalServerError, immichErr(500, "stat failed"))
		return
	}

	c.Header("Cache-Control", "public, max-age=31536000, immutable")
	c.Header("Content-Disposition", contentDisposition(filepath.Base(a.OriginalPath)))
	http.ServeContent(c.Writer, c.Request, filepath.Base(a.OriginalPath), fi.ModTime(), f)
}

func contentTypeFor(path string) string {
	ext := filepath.Ext(path)
	switch ext {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".webp":
		return "image/webp"
	case ".gif":
		return "image/gif"
	}
	return originalMIME(path)
}

func contentDisposition(name string) string {
	return `inline; filename="` + sanitizeName(name) + `"`
}
