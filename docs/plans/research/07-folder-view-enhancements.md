# Feature Research: Folder View Enhancements

**Votes:** 212 (12th most requested)
**Status:** Already fully implemented in both web and mobile
**Upstream Work:** Shipped Aug 2024 (web), March 2025 (mobile)

## Overview

Browse photos by folder/directory structure rather than chronological timeline. This feature is **already fully implemented** in Immich — both web and mobile have production-ready folder browsing.

## Current Implementation

### How It Works

Assets store their original import path in `asset.originalPath`. The folder view queries all unique directory paths, builds a tree structure client-side, and displays it as a hierarchical file browser.

### Web Implementation

**Route:** `/folders` with path parameter support
**Components:**

- `TreeItems.svelte` — sidebar tree navigation
- `TreeItemThumbnails.svelte` — grid of subfolders (max 8 cols)
- `Breadcrumbs.svelte` — path navigation with parent links
- `FoldersStore` — manages tree building, asset fetching, caching

**Data Structure:** `TreeNode` class (`web/src/lib/utils/tree-utils.ts`) — extends `Map`, supports collapsing single-child branches, parent traversal, children enumeration.

### Mobile Implementation

**Components:**

- `folder.page.dart` — main browser with AppBar, sort toggle
- `folder.service.dart` — recursive folder structure builder
- `folder.provider.dart` — Riverpod providers for tree and render list

**Models:** `RootFolder` / `RecursiveFolder` — recursive tree structure with name, path, subfolders.

### API Endpoints

- `GET /api/v1/view/folder/unique-paths` — all unique directory paths for user
- `GET /api/v1/view/folder?path=...` — assets in a specific folder (direct children only)
- Permission: `FolderRead`

### Feature Settings

- `folders.enabled` — master toggle (default: false, opt-in)
- `folders.sidebarWeb` — show in web sidebar (default: false)

## Potential Enhancements

Since the base feature is shipped, the focus shifts to improvements:

### 1. Folder-Level Bulk Actions (Medium Impact)

**Problem:** No way to perform actions on all assets in a folder at once.

**Solution:**

- "Select all in folder" button
- Bulk favorite, archive, delete, add-to-album for folder contents
- Recursive option: include subfolder assets

**Effort:** Small-Medium (3-5 days)

### 2. Folder Search/Filter (Medium Impact)

**Problem:** With many folders, finding a specific one requires manual browsing.

**Solution:**

- Search input in folder sidebar
- Fuzzy matching on folder path/name
- Jump-to-folder from search results

**Effort:** Small (2-3 days)

### 3. Custom Folder Sorting (Low Impact)

**Problem:** Folders sorted alphabetically only. No date-based or size-based sorting.

**Solution:**

- Sort options: by name, by newest asset date, by asset count, by total size
- Persist preference per user

**Effort:** Small-Medium (3-5 days)

### 4. Folder Statistics (Low Impact)

**Problem:** No quick way to see asset count, size, or date range per folder.

**Solution:**

- Show asset count badge on folder cards
- Optional detail view: total size, date range, file type breakdown

**Effort:** Small (2-3 days)

### 5. Folder Rename/Move (Complex)

**Problem:** Can't reorganize folder structure from UI.

**Solution:**

- Rename folder → updates `originalPath` for all contained assets
- Move folder → updates paths for entire subtree
- Dangerous operation — needs confirmation and backup

**Effort:** Large (2+ weeks, touches storage layer)

## Effort Estimate

**Quick enhancements (P1):** ~1 week — search/filter + bulk actions
**Medium improvements (P2):** ~1 week — sorting + statistics
**Complex features (P3):** ~3 weeks — rename/move operations

## Recommendation

This feature is complete as-is. Enhancements are nice-to-have but low priority compared to unimplemented features. Folder search and bulk actions would be the highest-value improvements.

## Key Files

- Web route: `web/src/routes/(user)/folders/+page.svelte`
- Tree utility: `web/src/lib/utils/tree-utils.ts`
- Store: `web/src/lib/stores/folders.svelte.ts`
- Server repo: `server/src/repositories/view-repository.ts`
- Mobile page: `mobile/lib/pages/library/folder/folder.page.dart`
- Mobile service: `mobile/lib/services/folder.service.dart`
