---
title: Fujifilm X-T5 RAW renderer
---

# Fujifilm X-T5 RAW renderer

This build can edit Fujifilm X-T5 RAF files with an optional independent
renderer sidecar. It supports all twenty X-T5 film simulations plus Exposure,
Contrast, Highlights, Shadows, Whites, Blacks, Temperature, Tint, Vibrance,
and Saturation. The original RAF is never modified.

The renderer is opt-in because its camera profiles are not distributed with
Immich. They are Adobe-authored data that must come from your own licensed
Lightroom installation. Do not publish the extracted profile directory without
reviewing the applicable license.

## Enable the service

Prepare the exact profile bundle described in
[`fuji-renderer/README.md`](https://github.com/allyorbase/immich/blob/main/fuji-renderer/README.md),
then add the following to `docker/.env`:

```dotenv
COMPOSE_PROFILES=fuji-raw
IMMICH_FUJI_RENDERER_ENABLED=true
FUJI_PROFILE_LOCATION=/absolute/host/path/to/profiles
```

Recreate the Compose project after changing environment variables. The
renderer stays on the private Compose network; do not publish its port.

At startup it verifies all required DCP and RGB-table files against the hashes
used to validate process model `lightroom-pv2012-independent-v6`. A missing or
different profile makes the sidecar fail rather than silently render different
colors.

## Storage and external libraries

The sidecar sees the normal Immich media volume at `/data`, reads RAF originals,
and is the only component needed to publish Fuji edited FullSize, Preview, and
Thumbnail derivatives. The stock Compose definitions mount the broad media
tree read-only in the sidecar, then overlay only `/data/thumbs` with a writable
bind. It stages each output in that destination directory and atomically
replaces the final file. The main server mount remains unchanged because
ordinary Immich uploads and maintenance still need writes.

External libraries must be mounted into both `immich-server` and
`immich-fuji-renderer` at the same absolute container path. Add each renderer
path to `FUJI_RENDERER_INPUT_ROOTS`, separated by colons. External mounts can
remain read-only; only `/data/thumbs` needs sidecar write access.

Run exactly one renderer replica. Full-resolution X-Trans and three-frame
M-RAW development uses a substantial memory working set, and the service
serializes requests to preserve deterministic output and avoid exhaustion.
