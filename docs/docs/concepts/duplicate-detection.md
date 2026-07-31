# Duplicate detection

Duplicate detection relies on machine learning and is enabled by default. It compares the search embeddings Immich already generates for contextual search, which is why it finds assets that _look_ alike rather than only byte-identical files — a resized or re-encoded copy of a photo is still detected.

This is distinct from the checksum-based deduplication that happens at upload time, which only skips files that are byte-for-byte identical to an existing asset.

Detection runs as a job after Smart Search completes for an asset; see [processing order](/reference/jobs#processing-order). Once an asset has been processed and added to a duplicate group, it appears in the review utility.

## How assets are preselected

When using "Deduplicate All" or viewing suggestions, Immich automatically preselects which assets to keep based on:

1. **Image size in bytes** — larger files are preferred as they typically have higher quality.
2. **Count of EXIF data** — assets with more metadata are preferred.

## What happens to metadata

When resolving duplicates, metadata from trashed assets is automatically synchronized to the kept asset. This synchronization only happens when **exactly one** asset is kept and at least one asset is trashed. When more than one asset is kept, metadata is not merged — the assets keep their own metadata and are simply removed from the duplicate group. The following metadata is synchronized:

| Name        | Description                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Album       | The kept asset will be added to _every_ album that the other assets in the group belong to.                                    |
| Favorite    | If any of the assets in the group have been added to favorites, the kept asset will also be added to favorites.                |
| Rating      | If one or more assets in the duplicate group have a rating, the highest rating is selected and synchronized to the kept asset. |
| Description | Descriptions from each asset are combined together and synchronized to the kept asset.                                         |
| Visibility  | The most restrictive visibility is applied to the kept asset.                                                                  |
| Location    | Latitude and longitude are copied if all assets with geolocation data in the group share the same coordinates.                 |
| Tag         | Tags from all assets in the group are merged and applied to the kept asset.                                                    |

To work through the results, see [Review duplicates](/user-guide/review-duplicates).
