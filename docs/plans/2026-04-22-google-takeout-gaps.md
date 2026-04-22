# Google Photos Takeout Import — Known Gaps

Tracker for import edge cases the current implementation does **not** handle.
Starting point: investigation of [issue #404](https://github.com/open-noodle/gallery/issues/404) (Apr 2026).

Reference implementation: [simulot/immich-go](https://github.com/simulot/immich-go) —
`adapters/googlePhotos/matchers.go` + `matcher_test.go` are the de-facto spec.

## Fixed in this PR

- **2024+ `.supplemental-metadata.json` sidecar suffix** (any prefix accepted, from
  `.supplemental-metadata` down to `.s`) — `matchSidecarToMedia` in
  `web/src/lib/utils/google-takeout-parser.ts`.

## Open gaps

### Localized album folder

Both `google-takeout-scanner.ts` (`trackItemStats`) and `google-takeout-parser.ts`
(`detectAlbums`) hardcode the string `'Google Photos'` when walking the path. Takeouts
from non-English Google accounts use localized folder names:

- German: `Google Fotos`
- Spanish: `Google Fotos`
- Italian: `Google Foto`
- Portuguese: `Google Fotos`
- Dutch: `Google Foto's`
- Japanese: `Google フォト`
- Chinese (zh-CN): `Google 相册`
- … (full list in immich-go `docs/misc/google-takeout.md`)

Confirmed against the issue #404 sample zip — the folder there is `Google Fotos`,
so album detection currently silently fails for that user even after the sidecar
matcher is fixed.

**Fix sketch:** detect the `Google <localized>` folder by the sibling presence of a
`Takeout/<lang>/...` path, or just accept any direct child of `Takeout/` as the root
and walk from there.

### `(N)` duplicate-index sidecars

Google appends `(1)`, `(2)`, … to both media and sidecar when multiple items share a
name. The index can appear in either position:

- `IMG_1234.jpg(1).json` (legacy position)
- `IMG_1234.jpg(1).supplemental-metadata.json`
- `IMG_1234.jpg.supplemental-metadata(1).json`

`matchSidecarToMedia` doesn't strip/compare indexes. Current behavior: a sidecar with
`(N)` won't match unless the media filename also has `(N)` in the exact same position.

**Fix sketch:** port `getFileIndex` from `matchers.go:108-115` — extract trailing
`(N)` from both the media name and sidecar name (post-suffix-strip), require them to
match.

### `-edited` / localized edited variants

Google Takeout exports an edited copy next to the original:

- `IMAG0061.JPG` + `IMAG0061.JPG.supplemental-metadata.json`
- `IMAG0061-edited.JPG` (shares the sidecar with the original)

Localized edited suffixes (confirmed by immich-go): `-modifié` (fr), `-bearbeitet` (de),
`-modificato` (it), plus unconfirmed `-editado`, `-отредактировано`, `-编辑`, `-編集済み`,
`-편집됨`, `-bewerkt`, `-muokattu`, `-відредаговано`, `-edytowane`, `-redigeret`, `-upravené`.

Current behavior: edited copies import without metadata; original is fine.

**Fix sketch:** after exact + truncated match fails, strip known edited suffixes from
the media basename and retry.

### Missing media extension on sidecar

Some sidecars omit the media extension entirely:

- `Peanut Butter Balls.supplemental-metadata.json` → media `Peanut Butter Balls.jpg`

Current behavior: no match (strips `.supplemental-metadata.json` → `Peanut Butter Balls`,
which isn't a media path).

**Fix sketch:** if no exact match, try appending each media extension from the sibling
set and retry.

### Live Photo `(N)` variants

Known open issue upstream (immich-go #1321): `IMG.HEIC` + `IMG(1).mp4` where the `.mp4`
should bind to `IMG.HEIC.supplemental-metadata(1).json`. Needs extension-agnostic
matching with `(N)` stripping.

## Out of scope for takeout importer

- Localized supplemental-metadata suffix — doesn't exist; Google keeps the suffix
  English regardless of account locale. Confirmed by issue #404 sample (German folder,
  English suffix) and immich-go research (no issues filed for localized sidecar suffix).
