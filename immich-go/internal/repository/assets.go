// Package repository is the only layer that talks SQL. Handlers/services go
// through it so the storage engine stays swappable and testable.
package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"immich-go/internal/models"
)

// ErrNotFound is returned for missing rows; handlers map it to 404/401.
var ErrNotFound = errors.New("not found")

// Store wraps the pooled *sql.DB.
type Store struct {
	db *sql.DB
}

// New builds a repository layer over an opened database.
func New(db *sql.DB) *Store { return &Store{db: db} }

// DB exposes the raw handle (used by the migration CLI & health checks).
func (s *Store) DB() *sql.DB { return s.db }

func nowISO() string { return time.Now().UTC().Format(time.RFC3339Nano) }

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

const userCols = `id, email, password, name, avatar_color, is_admin,
	created_at, updated_at, profile_image_path, onboarded_at`

func scanUser(row interface{ Scan(...any) error }) (*models.User, error) {
	u := &models.User{}
	var isAdmin int
	var created, updated string
	var onboarded sql.NullString
	err := row.Scan(&u.ID, &u.Email, &u.Password, &u.Name, &u.AvatarColor,
		&isAdmin, &created, &updated, &u.ProfileImagePath, &onboarded)
	if err != nil {
		return nil, err
	}
	u.IsAdmin = isAdmin == 1
	if u.CreatedAt, err = time.Parse(time.RFC3339Nano, created); err != nil {
		return nil, fmt.Errorf("parse created_at: %w", err)
	}
	if u.UpdatedAt, err = time.Parse(time.RFC3339Nano, updated); err != nil {
		return nil, fmt.Errorf("parse updated_at: %w", err)
	}
	if onboarded.Valid {
		t, err := time.Parse(time.RFC3339Nano, onboarded.String)
		if err == nil {
			u.OnboardedAt = &t
		}
	}
	return u, nil
}

// GetUserByEmail looks up a login candidate (deleted users excluded).
func (s *Store) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	q := `SELECT ` + userCols + ` FROM users WHERE email = ? AND deleted_at IS NULL`
	u, err := scanUser(s.db.QueryRowContext(ctx, q, email))
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return u, err
}

// GetUserByID fetches a live user by primary key.
func (s *Store) GetUserByID(ctx context.Context, id string) (*models.User, error) {
	q := `SELECT ` + userCols + ` FROM users WHERE id = ? AND deleted_at IS NULL`
	u, err := scanUser(s.db.QueryRowContext(ctx, q, id))
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return u, err
}

// InsertUser persists a new account. hashPassword must be bcrypt already.
func (s *Store) InsertUser(ctx context.Context, u *models.User) error {
	now := nowISO()
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO users (id,email,password,name,avatar_color,is_admin,created_at,updated_at,profile_image_path,onboarded_at)
		 VALUES (?,?,?,?,?,?,?,?,?,?)`,
		u.ID, u.Email, u.Password, u.Name, u.AvatarColor, b2i(u.IsAdmin),
		now, now, u.ProfileImagePath, now)
	return err
}

// HasAdmin reports whether at least one admin exists (drives /auth/status).
func (s *Store) HasAdmin(ctx context.Context) (bool, error) {
	var n int
	err := s.db.QueryRowContext(ctx,
		`SELECT COUNT(1) FROM users WHERE is_admin=1 AND deleted_at IS NULL`).Scan(&n)
	return n > 0, err
}

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

// InsertAssetTx writes an asset + its EXIF row inside one explicit
// transaction (SQLite best practice: every write path uses a tx).
func (s *Store) InsertAssetTx(ctx context.Context, a *models.Asset) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback() //nolint:errcheck // no-op after Commit

	resized := sql.NullString{}
	if a.ResizePath != nil {
		resized = sql.NullString{String: *a.ResizePath, Valid: true}
	}
	if _, err := tx.ExecContext(ctx,
		`INSERT INTO assets (id,device_asset_id,type,original_path,resize_path,user_id,owner_id,
			file_created_at,file_modified_at,created_at,updated_at,is_favorite,is_visible,status,source,
			duplication_id,file_size,resized,thumbhash)
		 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
		a.ID, a.DeviceAssetID, string(a.Type), a.OriginalPath, resized, a.UserID, a.OwnerID,
		a.FileCreatedAt.UTC().Format(time.RFC3339Nano), tsOrNull(a.FileModifiedAt),
		nowISO(), nowISO(), b2i(a.IsFavorite), b2i(a.IsVisible),
		string(a.Status), a.Source, a.DuplicationID, a.FileSize, b2i(a.Resized), a.Thumbhash,
	); err != nil {
		return fmt.Errorf("insert asset: %w", err)
	}

	e := a.Exif
	if e != nil {
		if _, err := tx.ExecContext(ctx,
			`INSERT INTO exif (asset_id,date_time_original,country,state,city,make,model,lens_model,
				latitude,longitude,orientation,bits_per_sample,color_space,frame_rate,file_size,
				exif_image_width,exif_image_height)
			 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
			a.ID, tsOrNull(e.DateTimeOriginal), e.Country, e.State, e.City, e.Make, e.Model, e.LensModel,
			f64OrNull(e.Latitude), f64OrNull(e.Longitude), e.Orientation,
			iOrNull(e.BitsPerSample), e.ColorSpace, f64OrNull(e.FrameRate), e.FileSize,
			e.ImageWidth, e.ImageHeight,
		); err != nil {
			return fmt.Errorf("insert exif: %w", err)
		}
	}
	return tx.Commit()
}

// FindDuplicateByHash returns an existing active asset with the same sha256
// for this owner (dedupe check before saving a file to disk).
func (s *Store) FindDuplicateByHash(ctx context.Context, userID, sha256hex string) (*models.Asset, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id,type,original_path,user_id,owner_id,file_created_at,thumbhash,file_size
		 FROM assets WHERE duplication_id=? AND user_id=? AND status='ACTIVE' LIMIT 1`,
		sha256hex, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	if !rows.Next() {
		return nil, ErrNotFound
	}
	a := &models.Asset{}
	var created string
	if err := rows.Scan(&a.ID, &a.Type, &a.OriginalPath, &a.UserID, &a.OwnerID, &created, &a.Thumbhash, &a.FileSize); err != nil {
		return nil, err
	}
	a.FileCreatedAt, _ = time.Parse(time.RFC3339Nano, created)
	return a, rows.Err()
}

// GetAsset loads one asset with its EXIF block.
func (s *Store) GetAsset(ctx context.Context, id string) (*models.Asset, error) {
	row := s.db.QueryRowContext(ctx,
		`SELECT id,device_asset_id,type,original_path,resize_path,user_id,owner_id,file_created_at,
			archived_at,deleted_at,is_favorite,status,file_size,resized,thumbhash,created_at,updated_at
		 FROM assets WHERE id=?`, id)
	a := &models.Asset{}
	var devAsset sql.NullString
	var resize sql.NullString
	var created string
	var archived, deleted sql.NullString
	var fav, resized int
	err := row.Scan(&a.ID, &devAsset, &a.Type, &a.OriginalPath, &resize, &a.UserID, &a.OwnerID,
		&created, &archived, &deleted, &fav, &a.Status, &a.FileSize, &resized, &a.Thumbhash,
		&a.CreatedAt, &a.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if devAsset.Valid {
		a.DeviceAssetID = &devAsset.String
	}
	if resize.Valid {
		a.ResizePath = &resize.String
	}
	a.IsFavorite = fav == 1
	a.Resized = resized == 1
	if t, err := time.Parse(time.RFC3339Nano, created); err == nil {
		a.FileCreatedAt = t
	}
	if archived.Valid {
		if t, err := time.Parse(time.RFC3339Nano, archived.String); err == nil {
			a.ArchivedAt = &t
		}
	}
	if deleted.Valid {
		if t, err := time.Parse(time.RFC3339Nano, deleted.String); err == nil {
			a.DeletedAt = &t
		}
	}
	if e, err := s.getExif(ctx, id); err == nil {
		a.Exif = e
	}
	return a, nil
}

func (s *Store) getExif(ctx context.Context, assetID string) (*models.ExifInfo, error) {
	row := s.db.QueryRowContext(ctx,
		`SELECT asset_id,date_time_original,country,state,city,make,model,lens_model,
			latitude,longitude,orientation,bits_per_sample,color_space,frame_rate,file_size,
			exif_image_width,exif_image_height FROM exif WHERE asset_id=?`, assetID)
	e := &models.ExifInfo{}
	var dto sql.NullString
	var country, state, city, make, model, lens, cs sql.NullString
	var lat, lon, fps sql.NullFloat64
	var bits sql.NullInt64
	err := row.Scan(&e.AssetID, &dto, &country, &state, &city, &make, &model, &lens,
		&lat, &lon, &e.Orientation, &bits, &cs, &fps, &e.FileSize, &e.ImageWidth, &e.ImageHeight)
	if err != nil {
		return nil, err
	}
	if dto.Valid {
		if t, err := time.Parse(time.RFC3339Nano, dto.String); err == nil {
			e.DateTimeOriginal = &t
		}
	}
	e.Country, e.State, e.City = nullStr(country), nullStr(state), nullStr(city)
	e.Make, e.Model, e.LensModel = nullStr(make), nullStr(model), nullStr(lens)
	e.ColorSpace = nullStr(cs)
	if lat.Valid {
		e.Latitude = &lat.Float64
	}
	if lon.Valid {
		e.Longitude = &lon.Float64
	}
	if fps.Valid {
		e.FrameRate = &fps.Float64
	}
	if bits.Valid {
		b := int(bits.Int64)
		e.BitsPerSample = &b
	}
	return e, nil
}

// AssetFilter drives the gallery query (GET /api/assets).
type AssetFilter struct {
	UserID      string
	Take        int
	Skip        int
	IsFavorite  *bool
	IsArchived  *bool
	IsTrashed   *bool
	Type        string // IMAGE | VIDEO | ""
	OrderBy     string // "file_created_at" default, "created_at" supported
	Order       string // asc|desc
}

// ListAssets returns one page of the gallery plus the total row count.
func (s *Store) ListAssets(ctx context.Context, f AssetFilter) ([]*models.Asset, int, error) {
	where := []string{"a.user_id = ?", "a.deleted_at IS NULL"}
	args := []any{f.UserID}

	if f.IsFavorite != nil {
		where = append(where, "a.is_favorite = ?")
		args = append(args, b2i(*f.IsFavorite))
	}
	if f.IsArchived != nil {
		if *f.IsArchived {
			where = append(where, "a.archived_at IS NOT NULL")
		} else {
			where = append(where, "a.archived_at IS NULL")
		}
	}
	if f.IsTrashed != nil {
		if *f.IsTrashed {
			where = append(where, "a.status = 'TRASHED'")
		} else {
			where = append(where, "a.status = 'ACTIVE'")
		}
	} else {
		where = append(where, "a.status = 'ACTIVE'")
	}
	if f.Type != "" {
		where = append(where, "a.type = ?")
		args = append(args, f.Type)
	}
	cond := ""
	if len(where) > 0 {
		cond = "WHERE " + join(where, " AND ")
	}

	var total int
	if err := s.db.QueryRowContext(ctx, "SELECT COUNT(1) FROM assets a "+cond, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	orderCol := "a.file_created_at"
	if f.OrderBy == "createdAt" {
		orderCol = "a.created_at"
	}
	dir := "DESC"
	if f.Order == "asc" {
		dir = "ASC"
	}
	take := f.Take
	if take <= 0 || take > 1000 {
		take = 500
	}
	q := `SELECT a.id,a.type,a.original_path,a.resize_path,a.user_id,a.owner_id,a.file_created_at,
			a.thumbhash,a.is_favorite,a.archived_at,a.status,a.file_size
		 FROM assets a ` + cond +
		" ORDER BY " + orderCol + " " + dir + ", a.id DESC LIMIT ? OFFSET ?"
	rows, err := s.db.QueryContext(ctx, q, append(args, take, f.Skip)...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	out := []*models.Asset{}
	for rows.Next() {
		a := &models.Asset{}
		var resize sql.NullString
		var fav int
		var archived sql.NullString
		var created string
		if err := rows.Scan(&a.ID, &a.Type, &a.OriginalPath, &resize, &a.UserID, &a.OwnerID,
			&created, &a.Thumbhash, &fav, &archived, &a.Status, &a.FileSize); err != nil {
			return nil, 0, err
		}
		if resize.Valid {
			a.ResizePath = &resize.String
		}
		a.IsFavorite = fav == 1
		if t, err := time.Parse(time.RFC3339Nano, created); err == nil {
			a.FileCreatedAt = t
		}
		if archived.Valid {
			if t, err := time.Parse(time.RFC3339Nano, archived.String); err == nil {
				a.ArchivedAt = &t
			}
		}
		if e, err := s.getExif(ctx, a.ID); err == nil {
			a.Exif = e
		}
		out = append(out, a)
	}
	return out, total, rows.Err()
}

// MarkResized updates worker bookkeeping after compression completes.
func (s *Store) MarkResized(ctx context.Context, id string, newSize int64, resizePath string) error {
	_, err := s.db.ExecContext(ctx,
		`UPDATE assets SET resized=1, file_size=?, resize_path=COALESCE(?, resize_path), updated_at=? WHERE id=?`,
		newSize, nullableStr(resizePath), nowISO(), id)
	return err
}

// PendingCompressionAssets lists IMAGE assets not yet compressed (worker feed).
func (s *Store) PendingCompressionAssets(ctx context.Context, limit int) ([]*models.Asset, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id,type,original_path,user_id,file_size FROM assets
		 WHERE resized=0 AND type='IMAGE' AND status='ACTIVE' ORDER BY created_at ASC LIMIT ?`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []*models.Asset{}
	for rows.Next() {
		a := &models.Asset{}
		if err := rows.Scan(&a.ID, &a.Type, &a.OriginalPath, &a.UserID, &a.FileSize); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

// ---------------------------------------------------------------------------
// Albums
// ---------------------------------------------------------------------------

// CreateAlbum inserts a new album owned by userID.
func (s *Store) CreateAlbum(ctx context.Context, al *models.Album) error {
	now := nowISO()
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO albums (id,album_name,description,"order",owner_id,created_at,updated_at)
		 VALUES (?,?,?,?,?,?,?)`,
		al.ID, al.AlbumName, al.Description, al.Order, al.OwnerID, now, now)
	return err
}

// GetAlbum loads an album plus its asset ids/counts.
func (s *Store) GetAlbum(ctx context.Context, id string) (*models.Album, error) {
	row := s.db.QueryRowContext(ctx,
		`SELECT id,album_name,description,"order",owner_id,created_at,updated_at FROM albums WHERE id=? AND deleted_at IS NULL`, id)
	al := &models.Album{}
	if err := row.Scan(&al.ID, &al.AlbumName, &al.Description, &al.Order, &al.OwnerID, &al.CreatedAt, &al.UpdatedAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if err := s.db.QueryRowContext(ctx,
		`SELECT COUNT(1) FROM album_assets WHERE album_id=?`, id).Scan(&al.AssetCount); err != nil {
		return nil, err
	}
	return al, nil
}

// ListAlbums returns all non-deleted albums owned by userID with counts.
func (s *Store) ListAlbums(ctx context.Context, userID string) ([]*models.Album, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT a.id,a.album_name,a.description,a."order",a.owner_id,a.created_at,a.updated_at,
		        (SELECT COUNT(1) FROM album_assets aa WHERE aa.album_id=a.id)
		 FROM albums a WHERE a.owner_id=? AND a.deleted_at IS NULL ORDER BY a.created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []*models.Album{}
	for rows.Next() {
		al := &models.Album{}
		if err := rows.Scan(&al.ID, &al.AlbumName, &al.Description, &al.Order, &al.OwnerID,
			&al.CreatedAt, &al.UpdatedAt, &al.AssetCount); err != nil {
			return nil, err
		}
		out = append(out, al)
	}
	return out, rows.Err()
}

// AddAssetsToAlbum links assets (ignored if already linked) in one tx.
func (s *Store) AddAssetsToAlbum(ctx context.Context, albumID string, assetIDs []string) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback() //nolint:errcheck
	now := nowISO()
	for i, aid := range assetIDs {
		if _, err := tx.ExecContext(ctx,
			`INSERT INTO album_assets (album_id,asset_id,created_at,"order") VALUES (?,?,?,?)
			 ON CONFLICT(album_id,asset_id) DO NOTHING`,
			albumID, aid, now, i); err != nil {
			return err
		}
	}
	_, err = tx.ExecContext(ctx, `UPDATE albums SET updated_at=? WHERE id=?`, now, albumID)
	if err != nil {
		return err
	}
	return tx.Commit()
}

// RemoveAssetsFromAlbum unlinks assets in one tx.
func (s *Store) RemoveAssetsFromAlbum(ctx context.Context, albumID string, assetIDs []string) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback() //nolint:errcheck
	ph := join(repeat("?", len(assetIDs)), ",")
	args := append([]any{albumID}, toArgs(assetIDs)...)
	if _, err := tx.ExecContext(ctx,
		`DELETE FROM album_assets WHERE album_id=? AND asset_id IN (`+ph+`)`, args...); err != nil {
		return err
	}
	_, err = tx.ExecContext(ctx, `UPDATE albums SET updated_at=? WHERE id=?`, nowISO(), albumID)
	if err != nil {
		return err
	}
	return tx.Commit()
}

// AlbumAssetIDs lists asset ids belonging to an album, ordered by insertion.
func (s *Store) AlbumAssetIDs(ctx context.Context, albumID string) ([]string, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT asset_id FROM album_assets WHERE album_id=? ORDER BY "order" ASC`, albumID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		out = append(out, id)
	}
	return out, rows.Err()
}

// ---------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------

func b2i(b bool) int {
	if b {
		return 1
	}
	return 0
}

func tsOrNull(t *time.Time) any {
	if t == nil {
		return nil
	}
	return t.UTC().Format(time.RFC3339Nano)
}

func f64OrNull(f *float64) any {
	if f == nil {
		return nil
	}
	return *f
}

func iOrNull(i *int) any {
	if i == nil {
		return nil
	}
	return *i
}

func nullStr(ns sql.NullString) *string {
	if !ns.Valid || ns.String == "" {
		return nil
	}
	s := ns.String
	return &s
}

func nullableStr(s string) any {
	if s == "" {
		return nil
	}
	return s
}

func join(parts []string, sep string) string {
	out := ""
	for i, p := range parts {
		if i > 0 {
			out += sep
		}
		out += p
	}
	return out
}

func repeat(s string, n int) []string {
	out := make([]string, n)
	for i := range out {
		out[i] = s
	}
	return out
}

func toArgs(ss []string) []any {
	out := make([]any, len(ss))
	for i, s := range ss {
		out[i] = s
	}
	return out
}
