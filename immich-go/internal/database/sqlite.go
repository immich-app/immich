// Package database opens and migrates the embedded SQLite database using the
// pure-Go driver modernc.org/sqlite (no CGO — safe for ARM64 cross-compiles).
package database

import (
	"context"
	"database/sql"
	"fmt"
	"net/url"
	"time"

	_ "modernc.org/sqlite" // pure Go SQLite driver
)

// schema contains every table the server needs. Statements are idempotent
// (CREATE TABLE IF NOT EXISTS) so opening the DB doubles as auto-migration.
var schema = []string{
	`CREATE TABLE IF NOT EXISTS users (
		id              TEXT PRIMARY KEY,
		email           TEXT NOT NULL UNIQUE,
		password        TEXT NOT NULL,            -- bcrypt hash ($2a$/$2b$, Immich-compatible)
		name            TEXT NOT NULL DEFAULT '',
		avatar_color    TEXT NOT NULL DEFAULT 'blue',
		is_admin        INTEGER NOT NULL DEFAULT 0,
		deleted_at      TEXT,
		created_at      TEXT NOT NULL,
		updated_at      TEXT NOT NULL,
		profile_image_path TEXT NOT NULL DEFAULT '',
		onboarded_at    TEXT
	)`,
	`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,

	`CREATE TABLE IF NOT EXISTS assets (
		id               TEXT PRIMARY KEY,
		device_asset_id  TEXT,
		type             TEXT NOT NULL CHECK (type IN ('IMAGE','VIDEO')),
		original_path    TEXT NOT NULL,
		resize_path      TEXT,                    -- thumbnail path
		encoded_video_path TEXT,
		user_id          TEXT NOT NULL REFERENCES users(id),
		owner_id         TEXT NOT NULL REFERENCES users(id),
		album_ref        TEXT,                    -- legacy link, nullable
		file_created_at  TEXT NOT NULL,            -- ISO8601, drives gallery sorting
		file_modified_at TEXT,
		created_at       TEXT NOT NULL,
		updated_at       TEXT NOT NULL,
		deleted_at       TEXT,
		archived_at      TEXT,
		is_favorite      INTEGER NOT NULL DEFAULT 0,
		is_visible       INTEGER NOT NULL DEFAULT 1,
		status           TEXT NOT NULL DEFAULT 'ACTIVE',
		source           TEXT NOT NULL DEFAULT 'UPLOAD',
		duplication_id   TEXT,                     -- sha256 dedupe key
		file_size        INTEGER NOT NULL DEFAULT 0,
		resized          INTEGER NOT NULL DEFAULT 0, -- set by background worker
		thumbhash        TEXT NOT NULL DEFAULT '',
	CHECK (status IN ('ACTIVE','TRASHED','DELETED'))
	)`,
	`CREATE INDEX IF NOT EXISTS idx_assets_user_created ON assets(user_id, file_created_at DESC)`,
	`CREATE INDEX IF NOT EXISTS idx_assets_duplication ON assets(duplication_id)`,
	`CREATE INDEX IF NOT EXISTS idx_assets_pending_compress ON assets(resized, type) WHERE status='ACTIVE'`,

	`CREATE TABLE IF NOT EXISTS exif (
		asset_id        TEXT PRIMARY KEY REFERENCES assets(id) ON DELETE CASCADE,
		date_time_original TEXT,
		country         TEXT, state TEXT, city TEXT,
		make            TEXT, model TEXT, lens_model TEXT,
		latitude        REAL, longitude REAL,
		orientation     INTEGER NOT NULL DEFAULT 1,
		bits_per_sample INTEGER, color_space TEXT,
		frame_rate      REAL,
		file_size       INTEGER NOT NULL DEFAULT 0,
		exif_image_width  INTEGER NOT NULL DEFAULT 0,
		exif_image_height INTEGER NOT NULL DEFAULT 0
	)`,

	`CREATE TABLE IF NOT EXISTS albums (
		id          TEXT PRIMARY KEY,
		album_name  TEXT NOT NULL,
		description TEXT NOT NULL DEFAULT '',
		"order"     TEXT NOT NULL DEFAULT 'desc',
		owner_id    TEXT NOT NULL REFERENCES users(id),
		created_at  TEXT NOT NULL,
		updated_at  TEXT NOT NULL,
		deleted_at  TEXT,
		is_external INTEGER NOT NULL DEFAULT 0,
		synced_at   TEXT,
		thumbnail_asset_id TEXT
	)`,
	`CREATE TABLE IF NOT EXISTS album_assets (
		album_id  TEXT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
		asset_id  TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
		created_at TEXT NOT NULL,
		"order"   INTEGER NOT NULL DEFAULT 0,
		PRIMARY KEY (album_id, asset_id)
	)`,

	`CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
}

// Open creates (or opens) the SQLite database at dbPath with pragmas tuned
// for concurrency on slow flash storage:
//   - journal_mode=WAL   : readers never block the single writer
//   - busy_timeout       : retry instead of SQLITE_BUSY errors
//   - synchronous=NORMAL : durability/perf balance under WAL
//   - foreign_keys=ON    : referential integrity like the Postgres original
// The pool is capped (maxConns) because SQLite serialises writers anyway.
func Open(ctx context.Context, dbPath string, maxConns int, busyTimeout time.Duration) (*sql.DB, error) {
	dsn := fmt.Sprintf("file:%s?_pragma=busy_timeout(%d)&_pragma=journal_mode(WAL)&_pragma=synchronous(NORMAL)&_pragma=foreign_keys(ON)&_pragma=temp_store(MEMORY)&_pragma=cache_size(-8000)",
		url.PathEscape(dbPath), busyTimeout.Milliseconds())

	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}
	// Small pool: one writer + a handful of WAL readers is optimal on C2.
	db.SetMaxOpenConns(maxConns)
	db.SetMaxIdleConns(maxConns)
	db.SetConnMaxLifetime(time.Hour)

	if err := db.PingContext(ctx); err != nil {
		db.Close()
		return nil, fmt.Errorf("ping sqlite: %w", err)
	}
	if err := migrate(ctx, db); err != nil {
		db.Close()
		return nil, err
	}
	return db, nil
}

// migrate applies the idempotent schema statements inside a single transaction.
func migrate(ctx context.Context, db *sql.DB) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin migration tx: %w", err)
	}
	for _, stmt := range schema {
		if _, err := tx.ExecContext(ctx, stmt); err != nil {
			_ = tx.Rollback()
			return fmt.Errorf("migration failed on %.60q...: %w", stmt, err)
		}
	}
	return tx.Commit()
}
