# Space Asset Add Limit

## Problem

The `POST /shared-spaces/{id}/assets` endpoint accepts an unbounded `assetIds` array. With a 10MB JSON body limit and ~40 bytes per UUID, a client could send ~250,000 asset IDs in a single request, causing massive synchronous DB operations. The same applies to the remove endpoint.

## Decision

Hard-limit both add and remove DTOs to 10,000 assets per request. Show a frontend warning when the limit is exceeded, directing users to external libraries or the existing "Add All Photos" background job.

The 10,000 limit is performance-driven (avoiding large synchronous DB writes), not payload-driven.

## Server Changes

- Add `@ArrayMaxSize(10_000)` to `SharedSpaceAssetAddDto.assetIds` and `SharedSpaceAssetRemoveDto.assetIds`
- Define `const MAX_SPACE_ASSETS_PER_REQUEST = 10_000` near the DTOs
- class-validator returns 400 automatically when exceeded

## Web Frontend Changes

- Extract a `SpaceAssetLimitWarning` component with `selectedCount` prop and `MAX_SPACE_ASSETS_PER_REQUEST = 10_000` constant
- When `selectedAssets.length > 10_000` in asset selection mode:
  - Disable the "Add to Space" button
  - Show a red warning banner with the message below
- When within the limit, normal behavior

### Warning Message

> Import your photos as an external library or use the Add All Photos background job. See the [documentation](https://github.com/open-noodle/gallery/blob/main/docs/docs/features/shared-spaces.md#got-a-lot-of-photos) for more info.

## i18n

New translation key for the warning message (with HTML link).

## Testing (TDD)

1. DTO validation tests — verify `SharedSpaceAssetAddDto` and `SharedSpaceAssetRemoveDto` reject arrays >10,000 and accept arrays <=10,000
2. Web component test — verify the warning banner appears and the add button is disabled when selection exceeds the limit
3. Implement changes to make tests pass

## Out of Scope

- No chunked client-side requests
- No auto-switching to bulk add
- No changes to the bulk add endpoint or repository layer
- No rate limiting across multiple requests
- Duplicate asset IDs are harmless (repository uses `ON CONFLICT DO NOTHING`)
