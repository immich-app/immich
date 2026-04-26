# Release Notes

## 4.54.0

Gallery 4.54.0 covers the changes shipped after `v4.53.0` through `v4.54.0`.

### Search and filters

- The global search palette is now the main search entry point from the top navigation.
- Free-text palette searches apply to the current page when possible, including Photos, Shared Spaces, and Map.
- Query recents now rerun searches directly, and the page sort control is available beside the top search trigger.
- Searchable page controls moved into the cmd+k flow, replacing the old page-specific search bars.
- Album detail pages and the album asset picker now support the full filter panel with album-scoped suggestions.
- Map marker counts and map timeline results now respect active filters and smart-search queries.
- Smart search keeps the VectorChord index path for person filters and avoids secondary tie-break ordering that can force slow sequential scans.
- Smart search rating filters are inclusive minimum-rating filters, and filter suggestion rating facets remain monotonic.

### Memories

- Rule-based memories were added alongside classic **On this day** memories.
- Birthday memories are generated from people with birthdays and enough qualifying photos.
- Recent-trip memories are generated from location patterns that differ from the user's recent home baseline.
- Rule memories include server-defined titles and subtitles for web and mobile clients.
- Nightly generation tracks a separate rule-memory cursor, deduplicates by rule key, and caps rule memories per user per day.

### Imports and metadata

- Google Photos Takeout import now handles `.supplemental-metadata.json` sidecars, localized Google Photos root folders, duplicate-index sidecars, edited variants, and sidecars that omit the media extension.
- Google Takeout album detection avoids non-Photos Takeout services in mixed exports.
- XMP sidecar copy works when the target asset is stored under an S3 relative key.

### Storage and downloads

- Large S3 archive downloads no longer open all object streams at once, avoiding socket exhaustion and stalled ZIP downloads.
- Archive appends are serialized so S3-backed downloads finish reliably.
- Deleting a user now cleans up user-scoped disk directories or S3 object prefixes.
- S3 relative-path handling was audited across copy and cleanup paths.

### Migration and release maintenance

- The switch-back-to-Immich script now accounts for upstream migrations that Gallery has pulled in after the Immich tag it is based on.
- The mobile release workflow rejects version overrides that do not use a `v` prefix.
