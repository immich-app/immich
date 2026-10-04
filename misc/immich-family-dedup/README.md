# immich-family-dedup

Cross-account deduplication for Immich originals using hardlinks: one
physical copy per unique file, while every account keeps its own asset
row, ownership, faces, albums and favorites.

I run a family Immich server where several accounts back up the same
photos and videos. Immich rejects duplicate uploads only within one
account — the `asset` table has a unique `(ownerId, checksum)` constraint
(see `server/src/services/asset-media.service.ts` in immich-app/immich) —
so the same original backed up by N accounts is stored N times and there
is no configuration option to avoid it. This tool recovers that space at
the storage level, below Immich, without touching the Immich database or
its ownership semantics.

## Motivation

In my deployment a shared import batch put the same originals into two
family accounts: one account received 24,670 assets (20,261 photos and
4,409 videos) and another received 88. 9,971 of those assets had a
cross-account duplicate on disk, so almost the entire batch was stored
twice. At terabyte scale that is the difference between a healthy disk
and a full one, and Immich cannot help here: deduplication is per
account, by design, because each account owns its files independently.

I wanted the space back without giving up that independence.

## Design

When the same checksum appears under more than one owner, the tool
replaces the later copy with a hardlink to the first one: one inode,
several directory names. Nothing else changes.

- The Immich database is never touched. Each account keeps its own asset
  row; deleting "my" copy deletes my row and my name for the file. The
  inode survives while any other name points to it, so nobody can delete
  another account's photo by deleting their own.
- Ownership is unaffected: hardlinks are a filesystem fact invisible to
  Immich. Backups, thumbnails, albums, sharing and deletion work exactly
  as before.
- It is safe to share the inode because Immich never rewrites originals
  in place: metadata edits go to a separate `.xmp` sidecar
  (`sidecarPath`, see `server/src/services/metadata.service.ts`), and
  every asset change writes a new file, never mutates the original bytes.
  A shared inode therefore never sees a partial or divergent write from
  Immich.

The oldest copy in each duplicate group becomes the canonical one; every
other copy is linked to it. Multi-copy groups (three or more accounts
with the same file) end up as one inode with one name per account.

## Safety properties and failure modes

The linking core is deliberately paranoid. The worst outcome of any
failure is losing the space saving for one asset, never losing data.

- **Atomic swap.** The new inode is linked to a temporary name next to
  the follower and swapped in with `rename(2)`. The follower path never
  disappears, not even for an instant. If the link or the swap fails,
  the temporary name is removed and the follower is left untouched.
- **Missing files.** A copy that is not on disk (for example an upload
  still in flight, whose row exists but whose file appears moments
  later) is skipped; the next pass picks it up.
- **Size mismatch with equal checksum.** If the database says two copies
  have the same checksum but their sizes differ on disk, something is
  wrong; the pair is skipped and reported.
- **Cross-filesystem pairs.** Hardlinks cannot cross a filesystem
  boundary; such pairs are skipped and reported.
- **In-place edit detection.** Every pair is re-checked right before the
  swap: if the inode or the link count diverged from the first
  observation (a write, replacement or relink in progress), the swap is
  abandoned and the follower is left alone. This guards against
  concurrent edits between the database query and the swap.
- **Idempotent.** A second pass over an already-linked pair does
  nothing; steady-state passes are read-only.

Failure modes worth knowing:

- A transient `SKIP` is normal while uploads are landing; those rows
  settle within one pass or disappear if the upload was retried. My
  deployment logged 4 such skips one night, all for paths in flight, and
  the next passes were clean.
- If someone rewrites an original by hand at the filesystem level (not
  something Immich ever does), a later pass sees the pair diverged and
  skips it rather than swapping bytes around; the space saving for that
  file is lost, not the data.
- The tool only links files whose paths the database maps under the
  upload root; anything outside is reported and never touched.

## Install

Requirements: Python 3.9+, Docker access to the Immich postgres
container, and write access to the upload volume (typically root on the
Docker host).

```sh
sudo install -m 755 immich-family-dedup.py /opt/immich-family-dedup.py
sudo install -m 644 immich-family-dedup.service /etc/systemd/system/immich-family-dedup.service
sudo systemctl daemon-reload
sudo systemctl enable --now immich-family-dedup.service
```

The unit runs the tool in a loop, one pass every 600 seconds:

```ini
[Unit]
Description=Immich cross-account dedup (hardlink duplicate originals)
After=docker.service
Requires=docker.service

[Service]
Type=simple
Environment=IMMICH_UPLOAD_ROOT=/srv/immich/upload
Environment=IMMICH_CONTAINER_PREFIX=/usr/src/app/upload
Environment=IMMICH_DEDUP_LOOP=600
ExecStart=/usr/bin/python3 /opt/immich-family-dedup.py
Restart=on-failure
RestartSec=30

[Install]
WantedBy=multi-user.target
```

## Configuration

Everything can be set on the command line or through the environment
(command line wins).

| Flag | Environment | Default | Meaning |
| --- | --- | --- | --- |
| `--upload-root` | `IMMICH_UPLOAD_ROOT` | `/srv/immich/upload` | Host directory where the Immich upload volume is mounted |
| `--container-prefix` | `IMMICH_CONTAINER_PREFIX` | `/usr/src/app/upload` | Upload path as stored in `asset.originalPath`, inside the container |
| `--loop` | `IMMICH_DEDUP_LOOP` | `600` | Seconds between passes when looping |
| `--db-container` | `IMMICH_DB_CONTAINER` | `immich-postgres` | Docker container running the Immich postgres |
| `--db-user` | `IMMICH_DB_USER` | `postgres` | Database user |
| `--db-name` | `IMMICH_DB_NAME` | `immich` | Database name |
| `--dry-run` | — | off | List what a pass would do without touching any file |
| `--once` | — | off | Run a single pass and exit instead of looping |

## Usage

```sh
# see what would happen, touching nothing
python3 immich-family-dedup.py --dry-run

# one real pass
python3 immich-family-dedup.py --once

# loop forever (what the systemd unit does)
python3 immich-family-dedup.py --loop 600
```

## Testing

The linking core is covered by unit tests that use temporary
directories only — no Immich instance and no database needed. The test
file sits next to the script; run it from this directory:

```sh
python3 -m unittest discover -v
```

The tests cover: hardlinking within one filesystem, the atomic swap
(the follower path is present at swap time and failures leave it
untouched), skipping when the canonical or the follower file is missing,
skipping on size mismatch with equal checksum, skipping across
filesystems, detection of in-place edits via inode/link-count
divergence, and idempotency (a second run links nothing).

## Measured results

From my family deployment (Immich v3.2.x, one host, one storage volume),
as of 2026-10-04:

- 9,971 cross-account duplicate assets were hardlinked. All 9,971 were
  verified on disk sharing an inode with their counterpart
  (`nlink=2`): 0 left on distinct inodes, 0 missing. That is **89.92
  GiB** of disk space saved.
- Steady state: about 25,800 duplicate groups across accounts; passes
  every 600 seconds report everything `already_linked` with 0 pending.
- The service has been stable since 2026-10-01.

## License

GNU Affero General Public License v3.0 (`AGPL-3.0-only`), the same
license as immich-app/immich; see the SPDX headers in the source files.
This is a standalone tool that interoperates with Immich and is not part
of the Immich project.
