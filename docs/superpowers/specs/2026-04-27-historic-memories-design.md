# Historic Memories Design

## Summary

Add a dedicated Memories index page where users can browse retained generated memories. The existing daily memories carousel and full-screen memory viewer remain unchanged.

The feature preserves generated memories going forward by making memory retention configurable. It does not backfill older possible memories in v1.

## Goals

- Show retained generated memories in a browseable web page.
- Preserve generated memories for 365 days by default.
- Allow admins to disable memory record cleanup with a `0` day retention value.
- Keep the existing "today's memories" carousel behavior unchanged.
- Reuse existing memory storage, API, title formatting, and viewer behavior.

## Non-Goals

- No backfill job for memories that were never generated or were already cleaned up.
- No global smart-search integration for memories in v1.
- No redesign of the existing full-screen memory viewer.
- No mobile implementation in this slice.

## Existing Context

Memories are already persisted in the `memory` table and linked to assets through `memory_asset`. The server exposes `/memories`, which can return either date-filtered memories or all retained memories depending on query parameters.

The current web home/photos page uses `memoryManager`, which loads only memories visible for the current date by calling `/memories?for=<today>`. The existing full-screen viewer opens via `/memory?id=<assetId>` or `/memory/photos/<assetId>` and plays through `memoryManager.memories`.

Memory cleanup currently deletes unsaved memory records older than 30 days. That hard-coded cleanup prevents a reliable historic page.

## Server Design

Add a new `memories` section to `SystemConfig`:

```ts
memories: {
  retentionDays: number;
}
```

The default value is `365`.

Validation:

- `retentionDays` is an integer.
- Minimum value is `0`.
- `0` means keep memory records forever.

Cleanup behavior:

- `MemoryRepository.cleanup()` continues removing `memory_asset` links for assets no longer visible in the timeline.
- Unsaved memory records are deleted only when `retentionDays > 0` and `createdAt < now - retentionDays`.
- Saved memories are never deleted by retention cleanup.
- When `retentionDays === 0`, cleanup skips memory record deletion entirely.

`MemoryService.onMemoriesCleanup()` reads system config with cache disabled and passes `retentionDays` into the repository cleanup call.

## API Design

No new endpoint is required for v1.

- Today's carousel continues using `/memories?for=<today>`.
- The historic index uses `/memories` without `for`.
- The historic index sorts the returned list client-side by `showAt ?? createdAt`, newest first.
- No pagination is added in v1. If retained memory volume becomes too large, a future slice can add a history-specific paginated endpoint without changing the page concept.

## Web Routes

Use a clean route split:

- `/memories`: new historic Memories index page.
- `/memory?id=<assetId>` and `/memory/photos/<assetId>`: existing full-screen viewer.

Update route helpers:

- `Route.memories()` points to `/memories`.
- Add a dedicated helper for viewer links, such as `Route.memoryViewer({ id })`, returning `/memory?id=<id>`.
- Existing carousel card links switch to the viewer helper.

The existing deep-link behavior for `/memory` remains valid.

## Web Data Flow

The Memories index fetches its own memory list using `searchMemories`. It does not reuse or mutate `memoryManager.memories`, because `memoryManager` is the today-only state used by the carousel and full-screen viewer.

Index page processing:

- Fetch retained memories.
- Filter out memories with no visible assets.
- Compute title with existing `getMemoryTitle`.
- Group by `showAt ?? createdAt`, newest month first.
- Search locally across title, subtitle, memory year/date, and type label.
- Filter locally between all memories and saved memories.

Card links use the first visible asset in the memory and open the existing viewer.

## Visual Design

The visual direction is a quiet archival contact sheet. The page should feel native beside Albums, Places, and the existing thumbnail grid.

Layout:

- Use `UserPageLayout` with title `Memories`.
- Put compact controls in the header: search and `All` / `Saved`.
- Sidebar item appears in the Library section near Favorites, Albums, Archive, and Trash.
- Command palette navigation opens `/memories`.
- Today's carousel may include a small "View all" link to `/memories`, but the carousel itself remains today-only.

Cards:

- Use photo-first cards with rounded thumbnail or collage cover.
- Show title below the cover.
- Show metadata below title: shown date and asset count.
- Show saved state as a subtle overlay/icon, not a large badge.
- Use existing primary hover color, gray surfaces, dark-mode tokens, and rounded thumbnail language.
- Use a memory-specific collage cover for memories with three or more assets so the page is distinct from album cards.

Avoid:

- Hero sections.
- Marketing or explanatory feature copy.
- Decorative gradients or a separate theme.
- Nested cards.
- Oversized empty panels.

## Empty, Loading, And Error States

Loading:

- Show a lightweight loading state consistent with existing user pages.

Empty:

- If no retained memories exist, show a compact `EmptyPlaceholder`.
- The copy should say no memories are available yet.
- Do not offer a backfill action.

Errors:

- If fetching memories fails, use existing toast/error handling and show a compact error placeholder.
- If a memory has no visible assets after filtering, hide it.
- If a card would not have a valid first asset, do not render it as a link.

## Admin Settings UI

Expose generated memory settings in system settings:

- `memories.retentionDays`
- `memories.birthday`
- `memories.recentTrips`

Preferred placement:

- Add a small Memories settings section if that fits the settings page cleanly.
- Otherwise place the retention field near Nightly Tasks' "Generate memories" setting.

Field behavior:

- Numeric input.
- Label: "Memory retention".
- Description: "Number of days to keep generated memories. Set to 0 to keep memories forever."
- Default shown value: `365`.
- Switches for birthday memories and recent trip memories.
- Both switches default on.
- Save through existing system config save flow.

## Testing Plan

Server:

- Config default includes `memories.retentionDays = 365`.
- Config default enables birthday and recent trip generated memories.
- Config validation accepts `0` and positive integers.
- Config validation rejects negative values.
- Config validation accepts and persists disabled birthday/recent trip flags.
- Cleanup deletes unsaved memories older than the configured retention.
- Cleanup keeps unsaved memories newer than the configured retention.
- Cleanup keeps saved memories regardless of age.
- Cleanup does not delete memory records when retention is `0`.
- Cleanup still removes invalid memory asset links.
- Disabled generated memory rules do not evaluate or persist rule memories.

Web:

- Memories settings renders and saves retention plus birthday/recent trip toggles.
- Route helper tests for `/memories` and the viewer helper.
- Index page groups by `showAt ?? createdAt`.
- Index page filters empty-asset memories.
- Search filters by title/subtitle/year/date/type.
- `All` / `Saved` filter works.
- Card link opens the existing viewer route with the first asset.
- Sidebar and command palette point to `/memories`.

E2E:

- Mock `/memories` data.
- Visit `/memories`.
- Verify grouped memory cards render.
- Click a memory card and verify the existing viewer opens.

## Rollout Notes

Users will only see memories retained after this change. Memories already deleted by the old cleanup policy will not reappear unless a future backfill feature is implemented.

The default retention of 365 days bounds growth while making the page useful for real history browsing.
