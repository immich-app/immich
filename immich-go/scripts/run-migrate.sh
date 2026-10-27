#!/usr/bin/env bash
# =============================================================================
# immich-go legacy importer runner — wraps `immich-migrate` for BOTH native
# installs and container installs so you never have to remember the flags.
#
# Usage:
#   ./scripts/run-migrate.sh --native \
#        --legacy-dsn "postgres://immich:secret@192.168.1.50:5432/immich?sslmode=disable" \
#        --library-root /mnt/old-immich-upload \
#        [--mode symlink|copy] [--batch 500] [--throttle 50ms] \
#        [--reset-password '$2b$...bcrypt-hash...']
#
#   ./scripts/run-migrate.sh --container \
#        --legacy-dsn "postgres://..." --library-root /host/path/to/old/upload
#        (the script bind-mounts library-root read-only into the container)
#
# Resume: safe to Ctrl-C anytime; progress is checkpointed in
# <photos-root>/.import_state and the next run continues where it stopped.
# =============================================================================
set -euo pipefail

MODE_TARGET="auto"   # auto | native | container
MIG_ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --native)         MODE_TARGET="native"; shift ;;
    --container)      MODE_TARGET="container"; shift ;;
    --docker|--podman) MODE_TARGET="container"; MIG_ARGS+=(); shift ;;
    *)                MIG_ARGS+=("$1"); shift ;;
  esac
done

log() { printf '\e[1;35m[migrate]\e[0m %s\n' "$*"; }
die() { printf '\e[1;31mERROR:\e[0m %s\n' "$*" >&2; exit 1; }

[[ ${#MIG_ARGS[@]} -gt 0 ]] || die "no migrate flags given — see --help of immich-migrate or this file's header"

detect_engine() {
  if command -v docker >/dev/null 2>&1; then echo docker
  elif command -v podman >/dev/null 2>&1; then echo podman
  else echo ""; fi
}

# ---------------- native path --------------------------------------------------
run_native() {
  local bin="immich-migrate"
  command -v "$bin" >/dev/null 2>&1 || bin="/usr/local/bin/immich-migrate"
  [[ -x "$bin" ]] || die "immich-migrate not found — install server first (install-native.sh)"
  log "Running native: $bin ${MIG_ARGS[*]}"
  exec "$bin" "${MIG_ARGS[@]}"
}

# ---------------- container path -----------------------------------------------
run_container() {
  local engine libroot arg target_vol="immich-go-data"
  engine="$(detect_engine)"
  [[ -n "$engine" ]] || die "no docker/podman found for --container mode"

  # extract --library-root so we can bind-mount it into the container
  libroot=""
  local filtered=()
  while [[ $# -gt 0 ]]; do
    if [[ "$1" == "--library-root" ]]; then libroot="$2"; shift 2; continue; fi
    filtered+=("$1"); shift
  done
  [[ -n "$libroot" ]] || die "--library-root <host path to old upload/library> is required in container mode"
  [[ -d "$libroot" ]] || die "library root does not exist: $libroot"

  local cont_lib="/uploads/library"
  log "Engine=$engine  library=$libroot -> $cont_lib (read-only)"
  exec "$engine" run --rm \
    -v "${target_vol}:/data" \
    -v "${libroot}:${cont_lib}:ro" \
    --memory 700m \
    immich-go:latest \
    --entrypoint /usr/local/bin/immich-migrate \
    "${filtered[@]}" --new-db /data/immich.db --library-root "$cont_lib" \
    --photos-root /data/photos
}

# ---------------- dispatch -------------------------------------------------------
if [[ "$MODE_TARGET" == "auto" ]]; then
  if command -v immich-migrate >/dev/null 2>&1 || [[ -x /usr/local/bin/immich-migrate ]]; then
    MODE_TARGET=native
  elif [[ -n "$(detect_engine)" ]]; then
    MODE_TARGET=container
  else
    die "cannot auto-detect: no immich-migrate binary and no docker/podman. Install first."
  fi
fi

case "$MODE_TARGET" in
  native)    run_native ;;
  container) run_container "${MIG_ARGS[@]}" ;;
esac
