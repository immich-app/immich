# Google Photos Import

Gallery can import a Google Photos Takeout export directly from the web app. The importer runs in your browser, scans the selected ZIP files or Takeout folder, matches Google metadata sidecars to media files, uploads the media through the normal upload API, and optionally recreates albums from Takeout folders.

Open **Import** from the Gallery app, choose **Google Photos**, then select either:

- one or more `.zip` files from Google Takeout
- an extracted Takeout folder

Keep the browser tab open until the import finishes.

## Import flow

1. **Source** — choose Google Photos.
2. **Files** — select Takeout ZIP files or an extracted folder.
3. **Scan** — Gallery reads media files and Google metadata sidecars locally in the browser.
4. **Review** — confirm the number of photos, videos, dates, locations, favorites, archived items, and detected albums.
5. **Import** — Gallery uploads items one by one and creates the selected albums.

The review step lets you choose whether to import favorites, archived state, descriptions, and whether to skip duplicates that already exist on the server.

## Preserved metadata

When a matching Takeout sidecar is available, Gallery imports:

- original taken date
- GPS coordinates
- description
- favorite state
- archived state
- album membership derived from Takeout folder names

If an item is missing date metadata, Gallery warns you during review and falls back to the file date during upload.

## Album detection

Takeout albums are detected from paths shaped like:

```text
Takeout/<Google Photos root>/<Album name>/<file>
```

Gallery recognizes localized Google Photos root folders such as `Google Fotos` and `Google フォト`, not only the English `Google Photos` folder. This prevents non-English Takeout exports from losing their album structure during scanning.

Auto-generated Takeout folders like **Photos from 2023** are shown but are not selected by default. You can select all albums, deselect all albums, or choose individual albums before importing.

## Sidecar matching

Google has changed Takeout sidecar naming several times. Gallery matches the common forms, including:

| Sidecar shape                                      | Example                                                              |
| -------------------------------------------------- | -------------------------------------------------------------------- |
| Classic appended `.json`                           | `IMG_1234.jpg.json`                                                  |
| 2024+ supplemental metadata suffix                 | `IMG_1234.jpg.supplemental-metadata.json`                            |
| Truncated supplemental suffixes                    | `IMG_1234.jpg.supplemental-me.json`                                  |
| Duplicate-index variants                           | `IMG_1234.jpg(1).json`, `IMG_1234.jpg.supplemental(1).json`          |
| Sidecars missing the media extension               | `Peanut Butter Balls.supplemental-metadata.json`                     |
| Edited copies sharing the original sidecar         | `IMAG0061.JPG.supplemental-metadata.json` plus `IMAG0061-edited.JPG` |
| Localized edited suffixes confirmed by Google data | `-edited`, `-modifié`, `-bearbeitet`, `-modificato`                  |

Sidecars are only matched to media files in the same folder. Non-Takeout JSON files such as `metadata.json`, `print-subscriptions.json`, shared album comments, or JSON from other Takeout services are ignored.

## Duplicate behavior

The importer uses stable Takeout-derived upload identifiers and the normal server-side duplicate detection. With **Skip duplicates already in Immich** enabled, duplicates are counted as skipped and can still be used for album creation when the server returns the existing asset id.

## Limits

- The import runs in the browser, so very large Takeouts are limited by browser memory and tab lifetime.
- Uploads run sequentially. You can pause and resume within the current tab session, but closing the tab stops the import.
- Live Photo edge cases where the video sidecar uses a different duplicate index than the still photo may still need manual review.
