package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"immich-go/internal/models"
	"immich-go/internal/repository"
)

// AlbumHandler implements /api/albums endpoints.
type AlbumHandler struct {
	repo *repository.Store
}

// NewAlbumHandler wires dependencies.
func NewAlbumHandler(repo *repository.Store) *AlbumHandler {
	return &AlbumHandler{repo: repo}
}

// createAlbumBody mirrors CreateAlbumDto.
type createAlbumBody struct {
	AlbumName   string   `json:"albumName" binding:"required"`
	Description string   `json:"description"`
	AssetIDs    []string `json:"assetIds"`
}

// Create handles POST /api/albums.
func (h *AlbumHandler) Create(c *gin.Context) {
	var body createAlbumBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, immichErr(400, "Invalid album payload"))
		return
	}
	userID := mustUserID(c)
	al := &models.Album{
		ID:          uuid.NewString(),
		AlbumName:   body.AlbumName,
		Description: body.Description,
		Order:       "desc",
		OwnerID:     userID,
	}
	if err := h.repo.CreateAlbum(c.Request.Context(), al); err != nil {
		c.JSON(http.StatusInternalServerError, immichErr(500, "Failed to create album"))
		return
	}
	if len(body.AssetIDs) > 0 {
		if err := h.repo.AddAssetsToAlbum(c.Request.Context(), al.ID, body.AssetIDs); err != nil {
			c.JSON(http.StatusInternalServerError, immichErr(500, "Failed to attach assets"))
			return
		}
	}
	created, err := h.repo.GetAlbum(c.Request.Context(), al.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, immichErr(500, "Failed to reload album"))
		return
	}
	c.JSON(http.StatusCreated, toAlbumResponse(created, nil))
}

// List handles GET /api/albums (owned albums with asset counts).
func (h *AlbumHandler) List(c *gin.Context) {
	userID := mustUserID(c)
	albums, err := h.repo.ListAlbums(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, immichErr(500, "Failed to list albums"))
		return
	}
	out := make([]models.AlbumResponseDto, 0, len(albums))
	for _, al := range albums {
		out = append(out, toAlbumResponse(al, nil))
	}
	c.JSON(http.StatusOK, out)
}

// Get handles GET /api/albums/:id — includes the full asset list.
func (h *AlbumHandler) Get(c *gin.Context) {
	id := c.Param("id")
	al, err := h.repo.GetAlbum(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			c.JSON(http.StatusNotFound, immichErr(404, "Album not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, immichErr(500, "Failed to load album"))
		return
	}
	ids, err := h.repo.AlbumAssetIDs(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, immichErr(500, "Failed to load album assets"))
		return
	}
	assets := make([]models.AssetResponseDto, 0, len(ids))
	for _, aid := range ids {
		a, err := h.repo.GetAsset(c.Request.Context(), aid)
		if err != nil {
			continue // tolerate dangling links
		}
		assets = append(assets, toAssetResponse(a))
	}
	c.JSON(http.StatusOK, toAlbumResponse(al, assets))
}

// updateAssetsBody mirrors AddAssetsToAlbumDto / RemoveAssetsFromAlbumDto.
type updateAssetsBody struct {
	IDs []string `json:"ids" binding:"required"`
}

// AddAssets handles PUT /api/albums/:id/assets.
func (h *AlbumHandler) AddAssets(c *gin.Context) {
	h.mutateAssets(c, true)
}

// RemoveAssets handles DELETE /api/albums/:id/assets.
func (h *AlbumHandler) RemoveAssets(c *gin.Context) {
	h.mutateAssets(c, false)
}

func (h *AlbumHandler) mutateAssets(c *gin.Context, add bool) {
	var body updateAssetsBody
	if err := c.ShouldBindJSON(&body); err != nil || len(body.IDs) == 0 {
		c.JSON(http.StatusBadRequest, immichErr(400, "Expected {\"ids\": [...]}"))
		return
	}
	id := c.Param("id")
	if _, err := h.repo.GetAlbum(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusNotFound, immichErr(404, "Album not found"))
		return
	}
	var err error
	if add {
		err = h.repo.AddAssetsToAlbum(c.Request.Context(), id, body.IDs)
	} else {
		err = h.repo.RemoveAssetsFromAlbum(c.Request.Context(), id, body.IDs)
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, immichErr(500, "Failed to update album"))
		return
	}
	c.JSON(http.StatusOK, gin.H{"count": len(body.IDs)})
}

// toAlbumResponse maps DB rows to Immich's AlbumResponseDto.
func toAlbumResponse(al *models.Album, assets []models.AssetResponseDto) models.AlbumResponseDto {
	dto := models.AlbumResponseDto{
		ID:                al.ID,
		AlbumName:         al.AlbumName,
		Description:       al.Description,
		AssetCount:        al.AssetCount,
		AlbumUsers:        []any{},
		Owners:            []any{},
		Shared:            false,
		IsActivityEnabled: false,
		Order:             al.Order,
		CreatedAt:         models.JSONTime(al.CreatedAt),
		UpdatedAt:         models.JSONTime(al.UpdatedAt),
		OwnerID:           al.OwnerID,
		Thumbnail:         nil,
	}
	if assets != nil {
		dto.Assets = assets
	}
	return dto
}
