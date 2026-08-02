# Immich Fuji renderer

This internal sidecar develops Fujifilm X-T5 RAF files with the independent
`lightroom-pv2012-independent-v6` pipeline. It vendors the exact renderer from
`fuji-xt5-luts` commit `22ac9ce55c0f685281b00ff20682c1e2f9157df1`
(`film-simulation-baseline-v2`), including its full-resolution X-Trans decode,
multi-frame RAF fusion, highlight-headroom recovery, lens corrections, twenty
film simulations, and ten Basic develop controls.

It does not load Lightroom, CameraRaw.dll, or any Adobe API. No Adobe profile
payload is included in this repository or image.

## Runtime requirements

- Linux x86-64. The full-active X-T5 decoder deliberately rejects any other
  rawpy/LibRaw ABI or library hash.
- A read-only `/profiles` mount containing the locally extracted profile
  bundle listed below.
- The same media paths visible to Immich, with `/data/thumbs` writable by this
  sidecar.
- Exactly one service replica. Full-resolution RAF development has a large
  memory working set, and the process serializes renders with one semaphore.

The service fixes `OMP_NUM_THREADS=1` before rawpy loads. This is required for
deterministic LibRaw X-Trans output.

## Profile bundle

The sidecar pins the SHA-256 of every required file and fails startup if any
payload is missing, symlinked, or from a different profile set:

```text
profiles/
├── dcp/
│   ├── adobe-standard.dcp
│   ├── acros.dcp
│   ├── acros-g-filter.dcp
│   ├── acros-r-filter.dcp
│   ├── acros-ye-filter.dcp
│   ├── astia-soft.dcp
│   ├── classic-chrome.dcp
│   ├── eterna-cinema.dcp
│   ├── monochrome.dcp
│   ├── monochrome-g-filter.dcp
│   ├── monochrome-r-filter.dcp
│   ├── monochrome-ye-filter.dcp
│   ├── pro-neg-hi.dcp
│   ├── pro-neg-std.dcp
│   ├── provia-standard.dcp
│   ├── reala-ace-v2.dcp
│   └── velvia-vivid.dcp
└── rgb-tables/
    ├── bleach-bypass.rgbtable
    ├── classic-neg.rgbtable
    ├── nostalgic-neg.rgbtable
    └── sepia.rgbtable
```

These files are Adobe-authored data extracted from the operator's licensed
local Lightroom installation. Keep the mount local and review the applicable
license before redistributing it. The four enhanced simulations use the
pinned PROVIA DCP followed by their matching RGB table.

## Docker Compose

Set these values in `docker/.env`:

```dotenv
COMPOSE_PROFILES=fuji-raw
IMMICH_FUJI_RENDERER_ENABLED=true
FUJI_PROFILE_LOCATION=/absolute/host/path/to/profiles
IMMICH_FUJI_RENDERER_TIMEOUT_MS=1800000
```

The sidecar is internal-only and publishes no host port. The stock server
mount remains unchanged. A custom deployment may give the main application a
read-only view of originals, but the sidecar needs a writable view of the
generated-image tree because it owns atomic publication and cleanup.

For an external library, mount it into both containers at the exact same
container path, add that path to the sidecar's colon-separated allowlist, and
keep it read-only:

```yaml
services:
  immich-server:
    volumes:
      - /host/photos:/external/photos:ro
  immich-fuji-renderer:
    volumes:
      - /host/photos:/external/photos:ro
    environment:
      FUJI_RENDERER_INPUT_ROOTS: /data:/external/photos
```

## Internal API

`GET /ping` verifies the complete profile bundle and returns the process model
and renderer release.

`POST /render` accepts only canonical absolute paths and the fixed twenty-slug
profile map:

```json
{
  "inputPath": "/data/upload/user/image.RAF",
  "profileSlug": "nostalgic-neg",
  "renderRevision": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "settings": {
    "exposure": 0,
    "contrast": 0,
    "highlights": 0,
    "shadows": 0,
    "whites": 0,
    "blacks": 0,
    "temperature": null,
    "tint": null,
    "vibrance": 0,
    "saturation": 0
  },
  "spatialEdits": [],
  "outputs": {
    "fullSizePath": "/data/thumbs/user/01/23/01234567-89ab-4cde-8fab-0123456789ab_fullsize_edited.jpeg",
    "previewPath": "/data/thumbs/user/01/23/01234567-89ab-4cde-8fab-0123456789ab_preview_edited.jpeg",
    "thumbnailPath": "/data/thumbs/user/01/23/01234567-89ab-4cde-8fab-0123456789ab_thumbnail_edited.webp"
  },
  "image": {
    "preview": { "format": "jpeg", "quality": 80, "progressive": false, "size": 1440 },
    "thumbnail": { "format": "webp", "quality": 80, "progressive": false, "size": 250 }
  }
}
```

Crop is applied first; ordered rotations and mirrors follow. FullSize is the
validated non-progressive JPEG at quality 95 with 4:4:4 subsampling. Preview
and thumbnail use their requested JPEG/WebP settings and maximum long edge.
All three files are staged beside their destinations and published with
`os.replace`. A newer 64-hex edit revision supersedes an older queued render
before any file is published.

`POST /cleanup` accepts `{ "paths": [...] }`, at most 64 unique paths. It can
only unlink non-symlink regular files under the output root whose basename is
`UUID_(fullsize|preview|thumbnail)_edited.(jpeg|webp)`. Missing files are an
idempotent success.

## Source layout

- `fuji_luts/` and `fuji_renderer/pipeline.py` contain the vendored independent
  color and RAW pipeline.
- `fuji_renderer/app.py` owns HTTP validation, serialization, stale-render
  coordination, atomic publication, and cleanup.
- `fuji_renderer/engine.py` contains the fixed profile map and pinned hashes.
- `tests/` contains authored contract, path-policy, spatial-edit, and revision
  tests. Repository or downloaded scripts are not used at runtime.
