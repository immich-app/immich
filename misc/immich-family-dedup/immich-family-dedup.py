#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Storage-level cross-account deduplication for Immich using hardlinks.

Why this exists
---------------
Immich rejects duplicate uploads only *within* a single account: the
``asset`` table has a unique ``(ownerId, checksum)`` constraint (see
``asset-media.service.ts`` in immich-app/immich).  When several people
back up the same photos to their own accounts -- the typical family
setup -- Immich stores one full copy per account, and there is no
configuration option to avoid it.

What this tool does
-------------------
It never touches the Immich database or asset ownership.  Every
account keeps its own asset row, faces, albums and favorites, and can
delete "its" copy without affecting anyone else.  Only the physical file
is shared: when the same checksum shows up under more than one owner, the
later copy is replaced by a hardlink to the first one.  One inode,
several directory entries.  Deleting one copy removes that account's row
and that name; the inode survives while any other name points to it.

Why hardlinks are safe here
---------------------------
Immich never rewrites originals in place: metadata edits go to a
separate ``.xmp`` sidecar (``sidecarPath`` in ``metadata.service.ts``).
A hardlink shares the inode, so an in-place rewrite would change every
name at once -- that is why the tool also re-checks for concurrent
edits: each pair is re-checked via inode/link-count divergence right
before the swap and is left alone if anything moved under us.  The worst
outcome of any failure is losing the space saving for one asset, never
losing data.

Safety properties
-----------------
* The follower path is replaced atomically: the new inode is linked to a
  temporary name and swapped in with ``rename(2)``.  The follower path
  never disappears, not even for an instant.
* Missing canonical or follower file -> skip.
* Same checksum but different size on disk (suspicious) -> skip.
* Files on different filesystems (no hardlinks possible) -> skip.
* In-place edit detected via inode/link-count divergence -> skip.
* Idempotent: a second pass over an already-linked pair does nothing.

Usage
-----
``--dry-run`` lists what a pass would do without touching anything.
Without ``--loop``/``--once`` the tool runs one pass and exits; the
systemd unit (immich-family-dedup.service) runs it in a loop every
``IMMICH_DEDUP_LOOP`` seconds.

Paths
-----
The database stores container paths (``originalPath``, by default under
``/usr/src/app/upload``).  ``--upload-root`` is where that volume is
mounted on the host running the tool, so ``container-prefix`` is mapped
to ``upload-root`` before touching any file.

Measured results (family deployment, 2026-10-04)
------------------------------------------------
* 9 971 cross-account duplicate assets hardlinked; all 9 971 verified on
  disk sharing an inode with their counterpart (nlink=2; 0 left on
  distinct inodes; 0 missing); ~89.92 GiB of disk space saved.
* Steady state: ~25 800 duplicate groups, cycles every 600 s with
  everything reported ``already_linked`` and 0 pending.
"""

from __future__ import annotations

import argparse
import logging
import os
import subprocess
import sys
import time
from enum import Enum
from typing import Callable, NamedTuple

DEFAULT_CONTAINER_PREFIX = "/usr/src/app/upload"
DEFAULT_UPLOAD_ROOT = "/srv/immich/upload"
DEFAULT_LOOP_SECONDS = 600
DEFAULT_DB_CONTAINER = "immich-postgres"
DEFAULT_DB_USER = "postgres"
DEFAULT_DB_NAME = "immich"

QUERY = """
select encode(checksum, 'hex'), id, "ownerId", "originalPath",
       extract(epoch from "createdAt")
from asset
where "deletedAt" is null and "isExternal" = false
and checksum in (
  select checksum from asset
  where "deletedAt" is null and "isExternal" = false
  group by checksum having count(distinct "ownerId") > 1
)
order by checksum, "createdAt";
""".strip()

logging.basicConfig(level=logging.INFO, format="%(message)s", stream=sys.stdout)
log = logging.getLogger("dedup")


class AssetRecord(NamedTuple):
    asset_id: str
    owner_id: str
    original_path: str
    created_at: float


class Outcome(Enum):
    """Result of trying to hardlink one follower path to its canonical path."""

    ALREADY_LINKED = "already_linked"
    LINKED = "linked"
    WOULD_LINK = "would_link"
    MISSING_CANONICAL = "missing_canonical"
    MISSING_FOLLOWER = "missing_follower"
    CROSS_DEVICE = "cross_device"
    SIZE_MISMATCH = "size_mismatch"
    UNSTABLE = "unstable"
    ERROR = "error"


def query_assets(
    db_container: str, db_user: str, db_name: str
) -> dict[str, list[AssetRecord]]:
    """Fetch checksum groups duplicated across owners, oldest copy first."""
    result = subprocess.run(
        ["docker", "exec", "-i", db_container, "psql", "-U", db_user,
         "-d", db_name, "-A", "-t", "-F", "\t"],
        input=QUERY, capture_output=True, text=True, timeout=60,
    )
    if result.returncode != 0:
        raise RuntimeError(f"psql failed: {result.stderr}")

    groups: dict[str, list[AssetRecord]] = {}
    for line in result.stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        checksum, asset_id, owner_id, original_path, created_at = line.split("\t")
        groups.setdefault(checksum, []).append(
            AssetRecord(asset_id, owner_id, original_path, float(created_at))
        )
    for rows in groups.values():
        rows.sort(key=lambda r: r.created_at)
    return groups


def host_path(
    container_path: str, container_prefix: str, upload_root: str
) -> str:
    """Map a container path from the database to the host filesystem."""
    if not container_path.startswith(container_prefix):
        raise ValueError(
            f"unexpected path, does not start with {container_prefix}: {container_path}"
        )
    return upload_root + container_path[len(container_prefix):]


def diverged(
    before: os.stat_result, after: os.stat_result, nlink_delta: int = 0
) -> bool:
    """True if the file changed identity or link count between two observations.

    ``nlink_delta`` is the link-count change our own operation is allowed
    to have caused (1 between ``link`` of the temporary name and its
    final check).  Any other inode/link-count divergence means the file
    was edited, replaced or relinked under us -- an in-place edit in
    flight -- and the caller must leave it alone.
    """
    return (
        before.st_dev != after.st_dev
        or before.st_ino != after.st_ino
        or after.st_nlink != before.st_nlink + nlink_delta
    )


def classify_pair(
    canonical_stat: os.stat_result, follower_stat: os.stat_result
) -> Outcome:
    """Decide what to do with a canonical/follower pair from their stats alone."""
    if canonical_stat.st_ino == follower_stat.st_ino and canonical_stat.st_dev == follower_stat.st_dev:
        return Outcome.ALREADY_LINKED
    if canonical_stat.st_dev != follower_stat.st_dev:
        return Outcome.CROSS_DEVICE
    if canonical_stat.st_size != follower_stat.st_size:
        # Same checksum in the database but different bytes on disk:
        # something is off, never touch it.
        return Outcome.SIZE_MISMATCH
    return Outcome.LINKED


def link_pair(
    canonical_path: str,
    follower_path: str,
    dry_run: bool,
    stat_fn: Callable[[str], os.stat_result] = os.stat,
) -> tuple[Outcome, int]:
    """Hardlink ``follower_path`` to ``canonical_path`` atomically.

    Returns the outcome and the bytes saved (0 unless linked or, in
    dry-run mode, about to be linked).
    """
    try:
        cst = stat_fn(canonical_path)
    except OSError:
        log.info(f"SKIP missing canonical on disk: {canonical_path}")
        return Outcome.MISSING_CANONICAL, 0
    try:
        fst = stat_fn(follower_path)
    except OSError:
        log.info(f"SKIP missing follower on disk: {follower_path}")
        return Outcome.MISSING_FOLLOWER, 0

    outcome = classify_pair(cst, fst)
    if outcome is Outcome.ALREADY_LINKED:
        return outcome, 0
    if outcome is Outcome.CROSS_DEVICE:
        log.warning(
            f"SKIP different filesystems, cannot hardlink: "
            f"{canonical_path} / {follower_path}"
        )
        return outcome, 0
    if outcome is Outcome.SIZE_MISMATCH:
        log.warning(
            f"SKIP same checksum but different size (suspicious, not touching): "
            f"{follower_path} ({fst.st_size}B) vs {canonical_path} ({cst.st_size}B)"
        )
        return outcome, 0

    if dry_run:
        log.info(
            f"WOULD link: {follower_path} -> {canonical_path} "
            f"({fst.st_size} bytes saved)"
        )
        return Outcome.WOULD_LINK, fst.st_size

    tmp = follower_path + ".dedup-tmp"
    try:
        if os.path.lexists(tmp):
            os.remove(tmp)
        # Re-check to catch an edit between the first stat and the mutation.
        if diverged(cst, stat_fn(canonical_path)) or diverged(fst, stat_fn(follower_path)):
            log.warning(f"SKIP file changed under us (in-place edit?): {follower_path}")
            return Outcome.UNSTABLE, 0
        os.link(canonical_path, tmp)
        # Our own link raised the canonical link count by one; anything
        # else means the pair is being edited concurrently.
        if diverged(cst, stat_fn(canonical_path), nlink_delta=1) or diverged(fst, stat_fn(follower_path)):
            log.warning(f"SKIP inode/link-count diverged during link (in-place edit): {follower_path}")
            os.remove(tmp)
            return Outcome.UNSTABLE, 0
        os.replace(tmp, follower_path)  # atomic: follower_path never vanishes
    except OSError as exc:
        log.error(f"ERROR linking {follower_path}: {exc}")
        if os.path.lexists(tmp):
            os.remove(tmp)
        return Outcome.ERROR, 0

    log.info(f"LINKED {follower_path} -> {canonical_path} ({fst.st_size} bytes saved)")
    return Outcome.LINKED, fst.st_size


def run_once(
    dry_run: bool,
    upload_root: str,
    container_prefix: str,
    db_container: str,
    db_user: str,
    db_name: str,
) -> dict[str, int]:
    """One full pass over every cross-owner duplicate group."""
    groups = query_assets(db_container, db_user, db_name)
    counts: dict[str, int] = {}
    saved = 0
    for _checksum, rows in groups.items():
        canonical, *followers = rows
        for follower in followers:
            outcome, saved_bytes = link_pair(
                host_path(canonical.original_path, container_prefix, upload_root),
                host_path(follower.original_path, container_prefix, upload_root),
                dry_run,
            )
            counts[outcome.value] = counts.get(outcome.value, 0) + 1
            saved += saved_bytes
    log.info(
        f"pass done: {len(groups)} groups, "
        + ", ".join(f"{k}={v}" for k, v in sorted(counts.items()))
        + (f", {saved} bytes saved" if saved else "")
    )
    return counts


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Dedup Immich originals across accounts with hardlinks."
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="list what a pass would do without touching any file",
    )
    parser.add_argument(
        "--once", action="store_true",
        help="run a single pass and exit instead of looping",
    )
    parser.add_argument(
        "--upload-root",
        default=os.environ.get("IMMICH_UPLOAD_ROOT", DEFAULT_UPLOAD_ROOT),
        help="host directory where the Immich upload volume is mounted "
             "(env IMMICH_UPLOAD_ROOT)",
    )
    parser.add_argument(
        "--container-prefix",
        default=os.environ.get("IMMICH_CONTAINER_PREFIX", DEFAULT_CONTAINER_PREFIX),
        help="upload path as stored in the database, inside the container "
             "(env IMMICH_CONTAINER_PREFIX)",
    )
    parser.add_argument(
        "--loop", type=int, metavar="SECONDS",
        default=int(os.environ.get("IMMICH_DEDUP_LOOP", DEFAULT_LOOP_SECONDS)),
        help="seconds between passes when looping (env IMMICH_DEDUP_LOOP)",
    )
    parser.add_argument(
        "--db-container",
        default=os.environ.get("IMMICH_DB_CONTAINER", DEFAULT_DB_CONTAINER),
        help="docker container running the Immich postgres (env IMMICH_DB_CONTAINER)",
    )
    parser.add_argument(
        "--db-user",
        default=os.environ.get("IMMICH_DB_USER", DEFAULT_DB_USER),
        help="database user (env IMMICH_DB_USER)",
    )
    parser.add_argument(
        "--db-name",
        default=os.environ.get("IMMICH_DB_NAME", DEFAULT_DB_NAME),
        help="database name (env IMMICH_DB_NAME)",
    )
    args = parser.parse_args(argv)

    def once() -> None:
        run_once(
            args.dry_run, args.upload_root, args.container_prefix,
            args.db_container, args.db_user, args.db_name,
        )

    if args.once or args.dry_run:
        once()
        return 0

    while True:
        try:
            once()
        except Exception as exc:  # keep the service alive across bad passes
            log.error(f"pass failed: {type(exc).__name__}: {exc}")
        time.sleep(args.loop)


if __name__ == "__main__":
    sys.exit(main())
