# Video Trim Download Fix & Edited Indicator

## Problem

Three issues with video trimming UX:

1. **Download broken:** Downloading a trimmed video gives a JPEG still frame instead of the trimmed MP4
2. **No edited indicator:** No visual hint in the asset viewer that a video has been trimmed
3. **Confusing labels:** "Download" vs "Download Original" unclear — but caused by bug #1, not the labels

## Fix 1: Download query returns wrong file for trimmed videos

`buildGetForOriginal()` in `asset.repository.ts` joins `asset_file` filtering `type = FullSize`. For trimmed videos, the edited files are:

- `EncodedVideo` (isEdited=true) — the actual trimmed MP4
- `FullSize` (isEdited=true) — a still frame JPEG extracted from the trimmed video

The query matches the `FullSize` row, returning the JPEG frame instead of the trimmed video.

**Fix:** Replace the LEFT JOIN with a correlated subquery that looks for both `FullSize` and `EncodedVideo` where `isEdited=true`, prioritizing `EncodedVideo` over `FullSize`:

```sql
SELECT (
  SELECT path FROM asset_file
  WHERE assetId = asset.id AND isEdited = true
    AND type IN ('FullSize', 'EncodedVideo')
  ORDER BY CASE type WHEN 'EncodedVideo' THEN 0 ELSE 1 END
  LIMIT 1
) as editedPath
```

Only video assets ever have an `EncodedVideo` edited file, so images continue getting `FullSize` as before. Pattern matches the existing `getForVideo` subquery.

Fixes both single-file download (`downloadOriginal`) and batch zip download (`downloadArchive`).

## Fix 2: "Edited" badge in asset viewer

Add a pill badge in the asset viewer nav bar when `asset.isEdited` is true. Place it as the first element in the right-side action button group (before loading dots). Pencil icon + "Edited" text, styled for the dark theme context.

## Fix 3: Labels — no changes

Keep "Download" / "Download Original" as-is. Once Fix 1 works, the distinction is clear.

## Files to modify

1. `server/src/repositories/asset.repository.ts` — `buildGetForOriginal` subquery
2. `server/src/queries/asset.repository.sql` — regenerated SQL docs
3. `web/src/lib/components/asset-viewer/asset-viewer-nav-bar.svelte` — edited badge
4. `i18n/en.json` — "edited" translation key
5. Test files for download service coverage

## Out of scope

- No label changes to Download/Download Original
- No revert-edit functionality
- No badge on timeline thumbnails
- No zip filename extension fix (pre-existing issue where zip entry keeps original extension even when edited file has different extension)
