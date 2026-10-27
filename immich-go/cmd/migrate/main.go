// immich-go migrate — legacy Immich (PostgreSQL) → Go/SQLite importer.
//
// Usage:
//
//	immich-migrate \
//	  --legacy-dsn "postgres://immich:secret@192.168.1.50:5432/immich?sslmode=disable" \
//	  --new-db /data/immich.db \
//	  --library-root /uploads/library \
//	  --photos-root /data/photos \
//	  --mode symlink            # or: copy
//	  [--reset-password <bcryptHash>]  # applied to every imported account
//	  [--batch 500] [--throttle 50ms]
//
// Behaviour:
//   * users/assets/exif/albums are streamed in keyset-paginated batches
//     (default 500 rows per SQLite transaction) and runtime.GC() runs after
//     each batch so the 2GB ODROID never balloons.
//   * checkpointing: the last fully-imported asset id is stored in
//     <photos-root>/.import_state; a restart resumes exactly there.
//   * file relinking (--mode symlink) creates zero-copy symlinks into the old
//     library; --mode copy re-organises files into /data/photos/<uid>/YYYY/MM/DD/
//     with a 32KB buffered stream. Missing files only log a warning.
//   * bcrypt hashes are carried over untouched (Immich uses bcrypt too).
//     argon2 hashes cannot be verified by this server, so pass
//     --reset-password '$2b$...$...' to replace them with a known bcrypt hash.
package main

import (
	"context"
	"database/sql"
	"encoding/hex"
	"errors"
	"flag"
	"fmt"
	"io"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"runtime"
	"strings"
	"syscall"
	"time"

	"immich-go/internal/database"
	"immich-go/internal/services/legacydb"
)

const importBufferSize = 32 * 1024 // same tiny-buffer philosophy as uploads

func main() {
	var (
		legacyDSN     = flag.String("legacy-dsn", envOr("LEGACY_DSN", ""), "PostgreSQL connection string of the old Immich server")
		newDB         = flag.String("new-db", envOr("IMMICHGO_DB_PATH", "/data/immich.db"), "target SQLite database path")
		libraryRoot   = flag.String("library-root", envOr("LEGACY_LIBRARY", "/uploads/library"), "root folder of the legacy storage layout")
		photosRoot    = flag.String("photos-root", envOr("IMMICHGO_PHOTOS_DIR", "/data/photos"), "destination photos root")
		mode          = flag.String("mode", "symlink", "file relink mode: symlink | copy")
		resetPassword = flag.String("reset-password", "", "optional bcrypt hash to substitute for every imported password")
		batchSize     = flag.Int("batch", 500, "rows per SQLite transaction")
		throttle      = flag.Duration("throttle", 50*time.Millisecond, "sleep between batches (I/O & CPU brake for the S905)")
		stateFileFlag = flag.String("state-file", "", "checkpoint file (default <photos-root>/.import_state)")
	)
	flag.Parse()

	if *legacyDSN == "" || *libraryRoot == "" {
		flag.Usage()
		log.Fatal("error: --legacy-dsn and --library-root are required")
	}
	switch *mode {
	case "symlink", "copy":
	default:
		log.Fatalf("error: unknown --mode %q (want symlink|copy)", *mode)
	}

	statePath := *stateFileFlag
	if statePath == "" {
		statePath = filepath.Join(*photosRoot, ".import_state")
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		s := <-sig
		log.Printf("signal %s received — finishing current batch then exiting…", s)
		cancel()
	}()

	if err := run(ctx, opts{
		legacyDSN: *legacyDSN, newDB: *newDB, libraryRoot: *libraryRoot,
		photosRoot: *photosRoot, mode: *mode, resetPassword: *resetPassword,
		batchSize: *batchSize, throttle: *throttle, statePath: statePath,
	}); err != nil {
		log.Fatalf("migration failed: %v", err)
	}
	log.Println("migration completed successfully ✔")
}

type opts struct {
	legacyDSN, newDB, libraryRoot, photosRoot, mode, resetPassword string
	batchSize                                                      int
	throttle                                                       time.Duration
	statePath                                                      string
}

func run(ctx context.Context, o opts) error {
	// --- open targets --------------------------------------------------------
	db, err := database.Open(ctx, o.newDB, 5, 5*time.Second)
	if err != nil {
		return fmt.Errorf("open target sqlite: %w", err)
	}
	defer db.Close()

	src, err := legacydb.Connect(ctx, o.legacyDSN)
	if err != nil {
		return err
	}
	defer src.Close()

	if err := os.MkdirAll(o.photosRoot, 0o750); err != nil {
		return err
	}

	m := &migrator{db: db, src: src, o: o}

	// --- users (idempotent upsert, always safe to re-run) --------------------
	users, err := m.src.FetchUsers(ctx)
	if err != nil {
		return fmt.Errorf("fetch legacy users: %w", err)
	}
	nAdmin := 0
	for _, u := range users {
		if ctx.Err() != nil {
			return ctx.Err()
		}
		pw := u.Password
		if !strings.HasPrefix(pw, "$2") && o.resetPassword != "" {
			pw = o.resetPassword // argon2 etc. → force replacement
		} else if o.resetPassword != "" {
			pw = o.resetPassword
		}
		if err := m.upsertUser(ctx, u.ID, strings.ToLower(u.Email), pw, u.Name, u.IsAdmin, u.CreatedAt); err != nil {
			return fmt.Errorf("import user %s: %w", u.ID, err)
		}
		if u.IsAdmin {
			nAdmin++
		}
	}
	log.Printf("[migrate] users: %d imported (%d admins)", len(users), nAdmin)

	// --- assets with checkpointing -------------------------------------------
	resumeAfter, err := readCheckpoint(o.statePath)
	if err != nil {
		return err
	}
	if resumeAfter != "" {
		log.Printf("[migrate] resuming after asset id %s", resumeAfter)
	}

	total, skipped := 0, 0
	lastID := resumeAfter
	for {
		if ctx.Err() != nil {
			return ctx.Err()
		}
		page, err := m.src.FetchAssetsPage(ctx, lastID, o.batchSize)
		if err != nil {
			return fmt.Errorf("fetch assets page: %w", err)
		}
		if len(page) == 0 {
			break
		}
		tx, err := db.BeginTx(ctx, nil)
		if err != nil {
			return err
		}
		for _, la := range page {
			ok, err := m.importAsset(ctx, tx, la)
			if err != nil {
				_ = tx.Rollback()
				return fmt.Errorf("import asset %s: %w", la.ID, err)
			}
			if ok {
				total++
			} else {
				skipped++
			}
			lastID = la.ID
		}
		if err := tx.Commit(); err != nil {
			return fmt.Errorf("commit batch: %w", err)
		}
		if err := writeCheckpoint(o.statePath, lastID); err != nil {
			return err
		}
		runtime.GC()          // keep heap flat across huge imports
		time.Sleep(o.throttle) // I/O brake so the C2 stays cool & responsive
		log.Printf("[migrate] progress: %d imported, %d skipped (last id %s)", total, skipped, lastID)
	}

	// --- albums ---------------------------------------------------------------
	albums, err := m.src.FetchAlbums(ctx)
	if err != nil {
		return fmt.Errorf("fetch albums: %w", err)
	}
	nAl := 0
	for _, al := range albums {
		if ctx.Err() != nil {
			return ctx.Err()
		}
		if err := m.importAlbum(ctx, al); err != nil {
			log.Printf("[migrate] warning: album %s (%s): %v", al.ID, al.AlbumName, err)
			continue
		}
		nAl++
	}
	log.Printf("[migrate] albums: %d/%d imported", nAl, len(albums))
	log.Printf("[migrate] done: %d assets imported, %d skipped", total, skipped)
	return nil
}

// -----------------------------------------------------------------------------

type migrator struct {
	db  *sql.DB
	src *legacydb.Client
	o   opts
}

func (m *migrator) upsertUser(ctx context.Context, id, email, pwHash, name string, admin bool, createdAt time.Time) error {
	_, err := m.db.ExecContext(ctx,
		`INSERT INTO users (id,email,password,name,avatar_color,is_admin,created_at,updated_at,profile_image_path,onboarded_at)
		 VALUES (?,?,?,?,'blue',?,?,?,?,?)
		 ON CONFLICT(id) DO UPDATE SET email=excluded.email, password=excluded.password, name=excluded.name`,
		id, email, pwHash, name, b2i(admin),
		createdAt.UTC().Format(time.RFC3339Nano), time.Now().UTC().Format(time.RFC3339Nano),
		"", createdAt.UTC().Format(time.RFC3339Nano))
	return err
}

// importAsset maps one legacy row into SQLite + relinks its file.
// Returns (imported bool, err). Missing files warn+skip but never abort.
func (m *migrator) importAsset(ctx context.Context, tx *sql.Tx, la *legacydb.LegacyAsset) (bool, error) {
	// Skip already-present rows (e.g. resumed overlap window).
	var exists int
	if err := tx.QueryRowContext(ctx, `SELECT COUNT(1) FROM assets WHERE id=?`, la.ID).Scan(&exists); err != nil {
		return false, err
	}
	if exists > 0 {
		return false, nil
	}

	// Status mapping: legacy enum 'active'/'trash'/'deleted'.
	status := "ACTIVE"
	switch strings.ToLower(la.Status) {
	case "trash":
		status = "TRASHED"
	case "deleted":
		status = "DELETED"
	}

	// Locate the physical file inside the legacy library root.
	legacyAbs := resolveLegacyPath(m.o.libraryRoot, la.OriginalPath)
	if legacyAbs == "" {
		log.Printf("[migrate] warning: asset %s missing on disk (%s) — importing metadata only", la.ID, la.OriginalPath)
	}

	ext := strings.ToLower(filepath.Ext(la.OriginalPath))
	dest := filepath.Join(m.o.photosRoot, la.UserID,
		la.FileCreatedAt.Format("2006"), la.FileCreatedAt.Format("01"), la.FileCreatedAt.Format("02"),
		la.ID+ext)

	var fileSize int64
	if legacyAbs != "" {
		if fi, err := os.Stat(legacyAbs); err == nil {
			fileSize = fi.Size()
		}
		if err := os.MkdirAll(filepath.Dir(dest), 0o750); err != nil {
			return false, err
		}
		switch m.o.mode {
		case "symlink":
			if err := ensureSymlink(legacyAbs, dest); err != nil {
				return false, fmt.Errorf("symlink: %w", err)
			}
		case "copy":
			if err := copyFile(legacyAbs, dest); err != nil {
				return false, fmt.Errorf("copy: %w", err)
			}
		}
	}

	dup := hexSHA256Bytes(la.Checksum) // legacy checksum IS the sha256 → reuse for dedupe

	var archived, deleted any
	if la.ArchivedAt.Valid {
		archived = iso(la.ArchivedAt.Time)
	}
	if la.DeletedAt.Valid {
		deleted = iso(la.DeletedAt.Time)
	}
	var modTime any
	if la.FileModifiedAt.Valid {
		modTime = iso(la.FileModifiedAt.Time)
	}

	if _, err := tx.ExecContext(ctx,
		`INSERT INTO assets (id,type,original_path,resize_path,user_id,owner_id,file_created_at,file_modified_at,
			created_at,updated_at,deleted_at,archived_at,is_favorite,is_visible,status,source,
			duplication_id,file_size,resized,thumbhash)
		 VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'IMPORT', ?, ?, 0, '')`,
		la.ID, upperType(la.Type), dest, la.UserID, la.UserID,
		iso(la.FileCreatedAt), modTime, iso(la.CreatedAt), iso(la.UpdatedAt),
		deleted, archived, b2i(la.IsFavorite), b2i(la.IsVisible), status,
		dup, fileSize,
	); err != nil {
		return false, fmt.Errorf("insert asset %s: %w", la.ID, err)
	}

	// EXIF row (nullable columns straight from the join).
	dtOrig := any(nil)
	if la.ExifDTOrig.Valid {
		dtOrig = iso(la.ExifDTOrig.Time)
	}
	if _, err := tx.ExecContext(ctx,
		`INSERT INTO exif (asset_id,date_time_original,country,state,city,make,model,lens_model,
			latitude,longitude,orientation,bits_per_sample,color_space,frame_rate,file_size,
			exif_image_width,exif_image_height)
		 VALUES (?,?,?,NULL,NULL,?,?,NULL,?,?,?,?,NULL,NULL,?,?,?)`,
		la.ID, dtOrig, nullStr(la.ExifCountry), nullStr(la.ExifMake), nullStr(la.ExifModel),
		nullF(la.ExifLat), nullF(la.ExifLon), orDefaultI(la.ExifOrientation, 1),
		fileSize, nullI(la.ExifWidth), nullI(la.ExifHeight),
	); err != nil {
		return false, fmt.Errorf("insert exif %s: %w", la.ID, err)
	}
	return true, nil
}

func (m *migrator) importAlbum(ctx context.Context, al *legacydb.LegacyAlbum) error {
	tx, err := m.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback() //nolint:errcheck

	if _, err := tx.ExecContext(ctx,
		`INSERT INTO albums (id,album_name,description,"order",owner_id,created_at,updated_at)
		 VALUES (?,?,?,'desc',?,?,?)
		 ON CONFLICT(id) DO UPDATE SET album_name=excluded.album_name`,
		al.ID, al.AlbumName, al.Description, al.OwnerID, iso(al.CreatedAt), iso(al.UpdatedAt)); err != nil {
		return err
	}
	now := iso(time.Now())
	for i, aid := range al.AssetIDs {
		var exists int
		if err := tx.QueryRowContext(ctx, `SELECT COUNT(1) FROM assets WHERE id=?`, aid).Scan(&exists); err != nil {
			return err
		}
		if exists == 0 {
			continue // asset wasn't imported (missing/deleted) — skip link
		}
		if _, err := tx.ExecContext(ctx,
			`INSERT INTO album_assets (album_id,asset_id,created_at,"order") VALUES (?,?,?,?)
			 ON CONFLICT(album_id,asset_id) DO NOTHING`,
			al.ID, aid, now, i); err != nil {
			return err
		}
	}
	return tx.Commit()
}

// ---------------------------------------------------------------------------
// pure helpers
// ---------------------------------------------------------------------------

// resolveLegacyPath turns an Immich originalPath (absolute or relative like
// "upload/library/ab/cd/uuid.jpg") into a real file under libraryRoot,
// trying a few common layouts. Returns "" when nothing matches.
func resolveLegacyPath(libraryRoot, originalPath string) string {
	candidates := []string{originalPath}
	base := filepath.Base(originalPath)
	// hashed layout: <root>/<xx>/<yy>/<uuid>.jpg
	clean := strings.TrimPrefix(originalPath, "/")
	parts := strings.Split(clean, "/")
	if len(parts) >= 2 {
		candidates = append(candidates, filepath.Join(libraryRoot, base))
		candidates = append(candidates, filepath.Join(libraryRoot, parts[len(parts)-2], base))
	}
	// full mirror of the DB path under the root
	candidates = append(candidates, filepath.Join(libraryRoot, clean))
	for _, c := range candidates {
		if fi, err := os.Stat(c); err == nil && !fi.IsDir() {
			return c
		}
	}
	return ""
}

func ensureSymlink(target, link string) error {
	cur, err := os.Readlink(link)
	if err == nil && cur == target {
		return nil // already correct
	}
	if err == nil {
		os.Remove(link) // stale link → recreate
	} else if !errors.Is(err, os.ErrNotExist) {
		fi, serr := os.Lstat(link)
		if serr == nil && fi.Mode()&os.ModeSymlink == 0 {
			return nil // a real file already sits here; leave it alone
		}
	}
	tmp := link + ".tmp-link"
	os.Remove(tmp)
	if err := os.Symlink(target, tmp); err != nil {
		return err
	}
	return os.Rename(tmp, link)
}

// copyFile streams with a fixed 32KB buffer — constant memory regardless of
// file size, gentle on eMMC/USB disks attached to the C2.
func copyFile(src, dst string) error {
	// Idempotency: same size already present → assume done.
	sfi, err := os.Stat(src)
	if err != nil {
		return err
	}
	if dfi, derr := os.Stat(dst); derr == nil && dfi.Size() == sfi.Size() {
		return nil
	}
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	tmp := dst + ".copy.tmp"
	out, err := os.Create(tmp)
	if err != nil {
		return err
	}
	buf := make([]byte, importBufferSize)
	if _, err := io.CopyBuffer(out, in, buf); err != nil {
		out.Close()
		os.Remove(tmp)
		return err
	}
	if err := out.Sync(); err != nil {
		out.Close()
		os.Remove(tmp)
		return err
	}
	if err := out.Close(); err != nil {
		os.Remove(tmp)
		return err
	}
	return os.Rename(tmp, dst)
}

func readCheckpoint(path string) (string, error) {
	b, err := os.ReadFile(path)
	if errors.Is(err, os.ErrNotExist) {
		return "", nil
	}
	if err != nil {
		return "", fmt.Errorf("read checkpoint: %w", err)
	}
	return strings.TrimSpace(string(b)), nil
}

// writeCheckpoint persists atomically (tmp+rename) so a power cut mid-migration
// can never corrupt the resume pointer.
func writeCheckpoint(path, lastID string) error {
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, []byte(lastID+"\n"), 0o644); err != nil {
		return fmt.Errorf("write checkpoint: %w", err)
	}
	return os.Rename(tmp, path)
}

func hexSHA256Bytes(b []byte) any {
	if len(b) == 0 {
		return nil
	}
	// Legacy checksums are raw sha256 BYTEA — reuse directly as dedupe key.
	return hex.EncodeToString(b)
}

func iso(t time.Time) string { return t.UTC().Format(time.RFC3339Nano) }

func b2i(b bool) int {
	if b {
		return 1
	}
	return 0
}

func upperType(s string) string {
	u := strings.ToUpper(s)
	if u != "IMAGE" && u != "VIDEO" {
		return "IMAGE"
	}
	return u
}

func nullStr(ns sql.NullString) any {
	if !ns.Valid {
		return nil
	}
	return ns.String
}

func nullF(nf sql.NullFloat64) any {
	if !nf.Valid {
		return nil
	}
	return nf.Float64
}

func nullI(ni sql.NullInt64) any {
	if !ni.Valid {
		return nil
	}
	return ni.Int64
}

func orDefaultI(ni sql.NullInt64, def int) int {
	if !ni.Valid {
		return def
	}
	return int(ni.Int64)
}

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
