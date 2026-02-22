# Duplicates Utility

Immich comes with a duplicates utility to help you detect assets that look visually similar. The duplicate detection feature relies on machine learning and is enabled by default. For more information about when the duplicate detection job runs, see [Jobs and Workers](/administration/jobs-workers). Once an asset has been processed and added to a duplicate group, it becomes available to review in the "Review duplicates" utility, which can be found [here](https://my.immich.app/utilities/duplicates).

## Reviewing duplicates

The review duplicates page allows the user to individually select which assets should be kept and which ones should be trashed. When more than one asset is kept, there is an option to automatically put the kept assets into a stack.

### Automatic preselection

When using "Deduplicate All" or viewing suggestions, Immich automatically preselects which assets to keep based on:

1. **Image size in bytes** — larger files are preferred as they typically have higher quality.
2. **Count of EXIF data** — assets with more metadata are preferred.

### Synchronizing metadata

When resolving duplicates, metadata from trashed assets is automatically synchronized to the kept assets. The following metadata is synchronized:

| Name        | Description                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Album       | The kept assets will be added to _every_ album that the other assets in the group belong to.                                         |
| Favorite    | If any of the assets in the group have been added to favorites, every kept asset will also be added to favorites.                    |
| Rating      | If one or more assets in the duplicate group have a rating, the highest rating is selected and synchronized to the kept assets.      |
| Description | Descriptions from each asset are combined together and synchronized to all the kept assets.                                          |
| Visibility  | The most restrictive visibility is applied to the kept assets.                                                                       |
| Location    | Latitude and longitude are copied if all assets with geolocation data in the group share the same coordinates.                       |
| Tag         | Tags from all assets in the group are merged and applied to every kept asset.                                                        |
