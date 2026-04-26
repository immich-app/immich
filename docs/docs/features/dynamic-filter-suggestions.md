# Dynamic Filter Suggestions

When you apply a filter on the Photos page or inside an album, all other filter panels dynamically update to show only values that exist in the current result set. Every visible option is guaranteed to return results.

## How it works

Select any filter value and the other panels narrow immediately:

1. Select **Germany** in Location -- People, Camera, Tags, Rating, and Media Type panels update to show only values present in German photos
2. Then select **Canon** in Camera -- the remaining panels narrow further to show only values for Canon photos taken in Germany
3. Every combination is valid -- you can never select a filter that produces zero results

This is called **faceted search** -- the same pattern used by Amazon, eBay, and other search-heavy applications.

## What updates

| Filter     | Updates when other filters change? | Notes                                                    |
| ---------- | ---------------------------------- | -------------------------------------------------------- |
| People     | Yes                                | Only people appearing in the filtered photos             |
| Location   | Yes (countries)                    | Cities update when you expand a country                  |
| Camera     | Yes (makes)                        | Models update when you expand a make                     |
| Tags       | Yes                                | Only tags assigned to filtered photos                    |
| Rating     | Yes                                | Shows ratings that can still satisfy the current minimum |
| Media Type | Yes                                | Photo/Video buttons hidden when no assets of that type   |
| Timeline   | Drives filtering                   | Selecting a year/month narrows all other panels          |
| Favorites  | Not dynamic                        | Simple toggle, always visible                            |

## Orphaned selections

If you select a value and then apply another filter that removes it from the available options, the selected value stays visible but appears **dimmed**. This lets you see why your result set might be empty and undo the selection with one click.

## Debouncing

Filter changes are debounced to avoid excessive server requests:

- **Discrete selections** (clicking a person, country, tag): 50ms debounce to batch rapid clicks
- **Temporal changes** (selecting a year or month): 200ms debounce
- **Clearing all filters**: instant (0ms)

Previous in-flight requests are automatically cancelled when a new filter change occurs.

## Architecture

A single API endpoint (`GET /search/suggestions/filters`) returns all suggestion categories in one round trip. The server runs 6 parallel queries -- one per category -- each applying all active filters **except its own category**. This exclusion is what makes it faceted: selecting Germany still shows all countries that match the other filters, not just Germany.

For album detail pages, the same endpoint is scoped with `albumId`. Album scoping cannot be combined with `spaceId` or `withSharedSpaces`, because an album and a space are separate collection boundaries.

### Server flow

```
Client: GET /search/suggestions/filters?country=Germany&withSharedSpaces=true

Server:
  1. Resolve user IDs (own + partners)
  2. Resolve shared space IDs (if withSharedSpaces)
  3. Run 6 queries in parallel:
     - Countries: all filters EXCEPT country/city
     - Camera makes: all filters EXCEPT make/model
     - Tags: all filters EXCEPT tagIds
     - People: all filters EXCEPT personIds
     - Ratings: all filters EXCEPT rating
     - Media types: all filters EXCEPT mediaType
  4. Return unified response
```

### Client flow

```
FilterPanel:
  1. User changes a filter (e.g., clicks a country)
  2. Debounce (50ms for discrete, 200ms for temporal)
  3. Call suggestionsProvider(currentFilterState)
  4. Receive response with narrowed suggestions
  5. Update all filter panels
  6. Orphaned selections shown dimmed
```

### Shared query helper

All 6 extraction queries share a common `buildFilteredAssetIds` helper that applies user/space scoping, temporal bounds, exif filters, person filters (via EXISTS), tag filters (via EXISTS), media type, and favorites. Each extraction method passes its own filter through `without()` to exclude its category before building the query.

## Supported pages

| Page         | Dynamic suggestions? | Notes                                           |
| ------------ | -------------------- | ----------------------------------------------- |
| Photos       | Yes                  | Full cross-filter scoping                       |
| Album detail | Yes                  | Scoped to assets already in the current album   |
| Album picker | Yes                  | Filters the assets available to add to an album |
| Map          | Partial              | Uses individual providers plus active filters   |
| Spaces       | Partial              | Uses individual providers plus active filters   |

Map and Spaces pages can adopt the unified endpoint in the future with minimal changes -- the `suggestionsProvider` interface is generic and the endpoint supports `spaceId` scoping.
