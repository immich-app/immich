# Duplicates Utility

Immich comes with a duplicates utility to help you detect assets that look visually similar. The duplicate detection feature relies on machine learning and is enabled by default. For more information about when the duplicate detection job runs, see [Jobs and Workers](/administration/jobs-workers). Once an asset has been processed and added to a duplicate group, it becomes available to review in the "Review duplicates" utility, which can be found [here](https://my.immich.app/utilities/duplicates).

## Reviewing duplicates

The review duplicates page allows the user to individually select which assets should be kept and which ones should be trashed. When more than one asset is kept, there is an option to automatically put the kept assets into a stack.

### Synchronizing metadata

Additionally, there are synchronization settings that can be used to synchronize metadata between assets in the group. See the table below for more information about what metadata is available to synchronize.

| Name        | Default | Description                                                                                                                                        |
| ----------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Album       | `false` | When enabled, the kept assets will be added to _every_ album that the other assets in the group belong to.                                         |
| Favorite    | `false` | When enabled, if any of the assets in the group have been added to favorites, every kept asset will also be added to favorites.                    |
| Rating      | `false` | When enabled, if one or more assets in the duplicate group have a rating, the highest rating is selected and then synchronized to the kept assets. |
| Description | `false` | When enabled, descriptions from each asset are combined together and then synchronized to all the kept assets.                                     |
| Visibility  | `false` | When enabled, the most restrictive visibility is applied the the kept assets.                                                                      |
| Location    | `false` | When enabled, latitude and longitude are only copied if among the group there is a single asset with geolocation data.                             |
| Tag         | `false` | When enabled, the kept assets will be tagged with _every_ tag that the other assets in the group were tagged with.                                 |
