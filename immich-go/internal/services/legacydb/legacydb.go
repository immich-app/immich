// Package legacydb reads an upstream Immich PostgreSQL database with a pure-Go
// driver (no CGO). It exposes exactly the rows the migration tool needs.
package legacydb

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	_ "github.com/lib/pq" // pure Go PostgreSQL driver
)

// User maps a row of the legacy "users" table.
type User struct {
	ID        string
	Email     string
	Name      string
	Password  string // bcrypt/argon2 hash as stored by Immich
	IsAdmin   bool
	CreatedAt time.Time
}

// LegacyAsset maps "assets" joined with "exif".
type LegacyAsset struct {
	ID               string
	UserID           string
	Type             string // 'IMAGE' | 'VIDEO' (enum in PG, text here)
	OriginalPath     string
	ResizePath       sql.NullString
	EncodedVideoPath sql.NullString
	FileCreatedAt    time.Time
	FileModifiedAt   sql.NullTime
	CreatedAt        time.Time
	UpdatedAt        time.Time
	DeletedAt        sql.NullTime
	ArchivedAt       sql.NullTime
	IsFavorite       bool
	IsVisible        bool
	Status           string
	Checksum         []byte // sha256 BYTEA → our duplication_id hex
	ExifMake         sql.NullString
	ExifModel        sql.NullString
	ExifCountry      sql.NullString
	ExifState        sql.NullString
	ExifCity         sql.NullString
	ExifLat          sql.NullFloat64
	ExifLon          sql.NullFloat64
	ExifDTOrig       sql.NullTime
	ExifWidth        sql.NullInt64
	ExifHeight       sql.NullInt64
	ExifOrientation  sql.NullInt64
}

// LegacyAlbum maps "albums" + member asset ids.
type LegacyAlbum struct {
	ID          string
	AlbumName   string
	Description string
	OwnerID     string
	CreatedAt   time.Time
	UpdatedAt   time.Time
	AssetIDs    []string
}

// Client wraps *sql.DB pointed at the legacy Immich Postgres.
type Client struct {
	db *sql.DB
}

// Connect opens the legacy DB. dsn is any libpq keyword/connection-string,
// e.g. "postgres://immich:pass@oldserver:5432/immich?sslmode=disable".
func Connect(ctx context.Context, dsn string) (*Client, error) {
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("open legacy pg: %w", err)
	}
	db.SetMaxOpenConns(2) // migration is sequential; keep server load low
	cctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	if err := db.PingContext(cctx); err != nil {
		db.Close()
		return nil, fmt.Errorf("ping legacy pg: %w", err)
	}
	return &Client{db: db}, nil
}

// Close releases the pool.
func (c *Client) Close() error { return c.db.Close() }

// FetchUsers returns every non-deleted user.
func (c *Client) FetchUsers(ctx context.Context) ([]*User, error) {
	rows, err := c.db.QueryContext(ctx,
		`SELECT id, email, name, password, "isAdmin", "createdAt"
		 FROM users WHERE deleted_at IS NULL ORDER BY "createdAt" ASC`)
	if err != nil {
		return nil, fmt.Errorf("query users: %w", err)
	}
	defer rows.Close()
	var out []*User
	for rows.Next() {
		u := &User{}
		if err := rows.Scan(&u.ID, &u.Email, &u.Name, &u.Password, &u.IsAdmin, &u.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, u)
	}
	return out, rows.Err()
}

// FetchAssetsPage streams assets after `afterID` (keyset pagination keeps RAM
// flat even for million-photo libraries). checksum IS NOT NULL filters out
// placeholder rows. Exif LEFT JOIN may yield NULL exif — handled downstream.
func (c *Client) FetchAssetsPage(ctx context.Context, afterID string, limit int) ([]*LegacyAsset, error) {
	q := `
	SELECT a.id, a."ownerId", a.type, a."originalPath", a."resizePath", a."encodedVideoPath",
	       a."fileCreatedAt", a."fileModifiedAt", a."createdAt", a."updatedAt",
	       a."deletedAt", a."archivedAt", a."isFavorite", a."isVisible", a.status, a.checksum,
	       e.make, e.model, e.country, e.state, e.city, e.latitude, e.longitude,
	       e."dateTimeOriginal", e."exifImageWidth", e."exifImageHeight", e.orientation
	FROM assets a
	LEFT JOIN exif e ON e.asset_id = a.id
	WHERE a.id > $1 AND a.checksum IS NOT NULL
	ORDER BY a.id ASC
	LIMIT $2`
	rows, err := c.db.QueryContext(ctx, q, afterID, limit)
	if err != nil {
		return nil, fmt.Errorf("query assets: %w", err)
	}
	defer rows.Close()

	var out []*LegacyAsset
	for rows.Next() {
		a := &LegacyAsset{}
		if err := rows.Scan(
			&a.ID, &a.UserID, &a.Type, &a.OriginalPath, &a.ResizePath, &a.EncodedVideoPath,
			&a.FileCreatedAt, &a.FileModifiedAt, &a.CreatedAt, &a.UpdatedAt,
			&a.DeletedAt, &a.ArchivedAt, &a.IsFavorite, &a.IsVisible, &a.Status, &a.Checksum,
			&a.ExifMake, &a.ExifModel, &a.ExifCountry, &a.ExifState, &a.ExifCity,
			&a.ExifLat, &a.ExifLon, &a.ExifDTOrig, &a.ExifWidth, &a.ExifHeight, &a.ExifOrientation,
		); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

// FetchAlbums returns albums with their ordered asset memberships.
func (c *Client) FetchAlbums(ctx context.Context) ([]*LegacyAlbum, error) {
	rows, err := c.db.QueryContext(ctx,
		`SELECT id, "albumName", description, "ownerId", "createdAt", "updatedAt"
		 FROM albums WHERE deleted_at IS NULL ORDER BY "createdAt" ASC`)
	if err != nil {
		return nil, fmt.Errorf("query albums: %w", err)
	}
	defer rows.Close()
	type meta struct {
		id, name, desc, owner string
		created, updated      time.Time
	}
	var metas []meta
	for rows.Next() {
		var m meta
		if err := rows.Scan(&m.id, &m.name, &m.desc, &m.owner, &m.created, &m.updated); err != nil {
			return nil, err
		}
		metas = append(metas, m)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	linkRows, err := c.db.QueryContext(ctx,
		`SELECT "albumId", "assetId" FROM albums_assets ORDER BY "albumId", "order" ASC`)
	if err != nil {
		// Older schema versions keep memberships elsewhere; warn but continue.
		fmt.Printf("[legacy] warning: could not read album memberships: %v\n", err)
		linkRows = nil
	}
	members := map[string][]string{}
	if linkRows != nil {
		defer linkRows.Close()
		for linkRows.Next() {
			var aid, sid string
			if err := linkRows.Scan(&aid, &sid); err != nil {
				return nil, err
			}
			members[aid] = append(members[aid], sid)
		}
		if err := linkRows.Err(); err != nil {
			return nil, err
		}
	}

	out := make([]*LegacyAlbum, 0, len(metas))
	for _, m := range metas {
		out = append(out, &LegacyAlbum{
			ID: m.id, AlbumName: strings.TrimSpace(m.name), Description: m.desc,
			OwnerID: m.owner, CreatedAt: m.created, UpdatedAt: m.updated,
			AssetIDs: members[m.id],
		})
	}
	return out, nil
}
