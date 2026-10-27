package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"immich-go/config"
	"immich-go/internal/models"
	"immich-go/internal/repository"
	"immich-go/pkg/exifutil"
)

// streamBufferSize is intentionally tiny (32KB): on the ODROID-C2 we must not
// let a large multipart body balloon into RAM — io.Copy with this buffer keeps
// peak upload memory constant regardless of file size.
const streamBufferSize = 32 * 1024

// AssetHandler implements upload + retrieval endpoints.
type AssetHandler struct {
	repo *repository.Store
	cfg  *config.Config
}

// NewAssetHandler wires dependencies.
func NewAssetHandler(repo *repository.Store, cfg *config.Config) *AssetHandler {
	return &AssetHandler{repo: repo, cfg: cfg}
}

// Upload handles POST /api/assets (multipart/form-data, field "assetData",
// optional "deviceAssetId"). Immich's mobile SDK posts exactly this shape.
//
// Flow:
//  1. Stream the part to disk with a 32KB io.Copy buffer while hashing SHA-256
//     on the fly (dedupe key).
//  2. If an active asset with the same hash exists for this user → 409.
//  3. Extract EXIF (date/GPS/camera) from the saved file.
//  4. Persist asset+exif rows in one transaction.
func (h *AssetHandler) Upload(c *gin.Context) {
	userID := mustUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, immichErr(http.StatusUnauthorized, "Invalid user"))
		return
	}

	fileHeader, err := c.FormFile("assetData")
	if err != nil {
		c.JSON(http.StatusBadRequest, immichErr(http.StatusBadRequest,
			"Invalid file format, expected multipart field 'assetData'"))
		return
	}
	deviceAssetID := c.PostForm("deviceAssetId")

	// --- decide type & destination path -------------------------------------
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	typ := models.AssetTypeImage
	if isVideoExt(ext) {
		typ = models.AssetTypeVideo
	}

	now := time.Now().UTC()
	assetID := uuid.NewString() // UUIDv4 — matches the client-side zod pattern
	dir := filepath.Join(h.cfg.PhotosDir, userID,
		now.Format("2006"), now.Format("01"), now.Format("02"))
	if err := os.MkdirAll(dir, 0o750); err != nil {
		c.JSON(http.StatusInternalServerError, immichErr(500, "Failed to create storage directory"))
		return
	}
	finalPath := filepath.Join(dir, sanitizeName(assetID+ext))

	// --- stream to disk + hash simultaneously (constant 32KB footprint) -----
	in, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, immichErr(400, "Unable to read uploaded file"))
		return
	}
	defer in.Close()

	out, err := os.Create(finalPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, immichErr(500, "Failed to open destination file"))
		return
	}
	hasher := sha256.New()
	buf := make([]byte, streamBufferSize)
	// TeeReader hashes each 32KB chunk as it streams to disk — no second pass.
	written, copyErr := io.CopyBuffer(out, io.TeeReader(in, hasher), buf)
	closeErr := out.Sync()
	if closeErr == nil {
		closeErr = out.Close()
	}
	if copyErr != nil || closeErr != nil {
		os.Remove(finalPath) // don't leave partial garbage behind
		msg := "Failed writing upload to disk"
		code := http.StatusInternalServerError
		if errors.Is(copyErr, http.ErrBodyReadAfterClose) {
			code = http.StatusBadRequest
		}
		c.JSON(code, immichErr(code, msg))
		return
	}
	shaHex := hex.EncodeToString(hasher.Sum(nil))

	// --- dedupe check --------------------------------------------------------
	if dup, err := h.repo.FindDuplicateByHash(c.Request.Context(), userID, shaHex); err == nil && dup != nil {
		os.Remove(finalPath)
		c.JSON(http.StatusConflict, gin.H{
			"error":      "Conflict",
			"message":    "Asset already exists",
			"statusCode": http.StatusConflict,
			"duplicateId": dup.ID,
		})
		return
	} else if err != nil && !errors.Is(err, repository.ErrNotFound) {
		os.Remove(finalPath)
		c.JSON(http.StatusInternalServerError, immichErr(500, "Dedupe check failed"))
		return
	}

	// --- EXIF extraction (images only; videos keep mtime dates) --------------
	var exifInfo *models.ExifInfo
	fileCreatedAt := now
	mtime := now
	if fi, statErr := os.Stat(finalPath); statErr == nil {
		mtime = fi.ModTime().UTC()
	}
	if typ == models.AssetTypeImage {
		if meta, exErr := exifutil.Extract(finalPath); exErr == nil {
			exifInfo = &models.ExifInfo{AssetID: assetID, FileSize: written}
			if meta.Orientation != 0 {
				exifInfo.Orientation = meta.Orientation
			} else {
				exifInfo.Orientation = 1
			}
			exifInfo.Make = strPtrOr(meta.Make)
			exifInfo.Model = strPtrOr(meta.Model)
			exifInfo.Latitude = meta.Latitude
			exifInfo.Longitude = meta.Longitude
			if meta.DateTimeOriginal != nil {
				t := meta.DateTimeOriginal.UTC()
				exifInfo.DateTimeOriginal = &t
				fileCreatedAt = t
			}
		}
	}

	a := &models.Asset{
		ID:            assetID,
		DeviceAssetID: strPtrOr(deviceAssetID),
		Type:          typ,
		OriginalPath:  finalPath,
		UserID:        userID,
		OwnerID:       userID,
		FileCreatedAt: fileCreatedAt,
		FileModifiedAt: &mtime,
		Status:        models.StatusActive,
		Source:        "SOURCE",
		DuplicationID: &shaHex,
		FileSize:      written,
		Resized:       false, // background worker (Phase 4) will pick it up
		Thumbhash:     "",    // filled by worker alongside the thumbnail
		Exif:          exifInfo,
	}
	if err := h.repo.InsertAssetTx(c.Request.Context(), a); err != nil {
		os.Remove(finalPath)
		c.JSON(http.StatusInternalServerError, immichErr(500, "Failed to persist asset metadata"))
		return
	}

	c.JSON(http.StatusOK, toAssetResponse(a))
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

func isVideoExt(ext string) bool {
	switch ext {
	case ".mp4", ".mov", ".m4v", ".avi", ".mkv", ".webm", ".3gp", ".wmv", ".mpg", ".mpeg":
		return true
	}
	return false
}

// sanitizeName prevents path traversal from crafted filenames.
func sanitizeName(name string) string {
	name = filepath.Base(name)
	name = strings.ReplaceAll(name, "..", "")
	if name == "." || name == "/" {
		return "file"
	}
	return name
}

func strPtrOr(s string) *string {
	if s == "" {
		return nil
	}
	v := s
	return &v
}

func immichErr(code int, msg string) gin.H {
	statusText := http.StatusText(code)
	return gin.H{"error": statusText, "message": msg, "statusCode": code}
}

// originalMIME guesses the mime type from the stored extension, like Immich.
func originalMIME(path string) string {
	ext := strings.ToLower(filepath.Ext(path))
	if m := mime.TypeByExtension(ext); m != "" {
		return strings.Split(m, ";")[0]
	}
	if isVideoExt(ext) {
		return "video/mp4"
	}
	return "image/jpeg"
}

// toAssetResponse maps a DB asset to the Immich AssetResponseDto wire format
// (hex thumbhash → base64, ISO timestamps with ms precision).
func toAssetResponse(a *models.Asset) models.AssetResponseDto {
	resp := models.AssetResponseDto{
		ID:              a.ID,
		DeviceAssetID:   a.DeviceAssetID,
		OwnerID:         a.OwnerID,
		UserID:          a.UserID,
		DeviceID:        "",
		Type:            a.Type,
		IsFavorite:      a.IsFavorite,
		ArchivedAt:      models.OptionalJSONTime(a.ArchivedAt),
		CreatedAt:       models.JSONTime(a.CreatedAt),
		DeletedAt:       models.OptionalJSONTime(a.DeletedAt),
		FileModifiedAt:  models.OptionalJSONTime(a.FileModifiedAt),
		UpdatedAt:       models.JSONTime(a.UpdatedAt),
		LocalDateTime:   models.StrPtr(models.JSONTime(a.FileCreatedAt)),
		People:          []any{},
		ProjectIDs:      []string{},
		Stack:           nil,
		LivePhotoVideoID: nil,
		Resized:         a.Resized,
	}
	if a.Thumbhash != "" {
		resp.Thumbhash = a.Thumbhash
	}
	e := a.Exif
	if e == nil {
		e = &models.ExifInfo{Orientation: 1}
	}
	resp.ExifInfo = models.ExifInfoDto{
		Make:             e.Make,
		Model:            e.Model,
		ExifImageWidth:   e.ImageWidth,
		ExifImageHeight:  e.ImageHeight,
		FileSizeInByte:   a.FileSize,
		Orientation:      models.IntPtr(orInt(e.Orientation, 1)),
		DateTimeOriginal: models.OptionalJSONTime(e.DateTimeOriginal),
		ModifyDate:       models.OptionalJSONTime(a.FileModifiedAt),
		Latitude:         e.Latitude,
		Longitude:        e.Longitude,
		Country:          e.Country,
		State:            e.State,
		City:             e.City,
		LensModel:        e.LensModel,
		Binary:           nil,
		FileCreatedAt:    models.StrPtr(models.JSONTime(a.FileCreatedAt)),
		Fps:              e.FrameRate,
	}
	return resp
}

func orInt(v, def int) int {
	if v == 0 {
		return def
	}
	return v
}
