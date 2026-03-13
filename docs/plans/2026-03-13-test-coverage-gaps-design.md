# Comprehensive Testing Plan for New Features — Design Doc

**Date:** 2026-03-13
**Scope:** Testing gaps across Shared Spaces, Gallery Branding, Mobile Integration, and critical gaps in Pet Detection, Image Editing, Google Photos Import

---

## Executive Summary

This design document outlines a comprehensive testing strategy organized by layer (Server, Web, Mobile) to achieve complete feature coverage across unit/integration/E2E tests.

**Coverage Priorities:**

- **Comprehensive (100% coverage target):** Shared Spaces, Gallery Branding, Mobile Integration
- **Critical Gaps Only:** Pet Detection, Image Editing, Google Photos Import

**Key Insight:** Features span 3+ layers; testing must validate both layer-internal correctness AND cross-layer integration (e.g., space asset additions flowing through timeline sync, Socket.IO events updating mobile UI).

---

## Part 1: Server Layer Tests

### 1.1 Shared Spaces (Comprehensive)

**Current Coverage:**

- `shared-space.service.spec.ts` — exists but needs audit
- `shared_space.controller.spec.ts` — exists
- Medium tests: `shared-space.repository.spec.ts` — partial

**Critical Gaps:**

| Area                     | Untested Paths                                                                 | Risk   | Recommended Tests                                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Permissions**          | Space member access checks on asset CRUD (read/view/download/update/delete)    | HIGH   | `should deny asset edit if not owner`, `should allow asset read if member`, `should restrict sharing to owners only`                |
| **Activity Logging**     | Creating/reading activity records, activity feed queries, date filtering       | MEDIUM | `should log 8 event types correctly`, `should filter activities by date range`, `should paginate activities`                        |
| **Timeline Integration** | `showInTimeline` toggle affecting personal timeline, asset visibility sync     | HIGH   | `should include space assets in timeline when showInTimeline=true`, `should exclude when false`, `should handle concurrent updates` |
| **Notifications**        | Space invites, member changes, activity notifications                          | MEDIUM | `should send notification on member invite`, `should notify on activity`, `should respect notification settings`                    |
| **Sync Edge Cases**      | Concurrent space updates, member role changes mid-sync, space deletion         | MEDIUM | `should handle concurrent member additions`, `should rollback on FK conflicts`, `should clean up assets on space delete`            |
| **Cover Photo**          | Thumbnail repositioning (`thumbnailCropY`), preview-vs-thumbnail size handling | LOW    | `should update cover crop position`, `should use preview for cover (not thumb)`                                                     |

**Test Implementation Notes:**

- Use `sharedSpaceFactory` (already exists) to generate test spaces
- Mock notification service to avoid email/queue side effects
- Medium tests need testcontainers for timeline sync queries (uses `EXISTS` subqueries)
- Permission tests should cover all 4 roles: `ADMIN`, `EDIT`, `VIEW`, `VIEWER`

**Dependencies:**

- Timeline service tests must be updated to cover space asset inclusion
- Notification service tests must be updated for space events

---

### 1.2 Gallery Branding (Comprehensive)

**Current Coverage:**

- No service layer code (branding is config-driven + web UI)
- `branding/config.json` has no schema validation tests

**Critical Gaps:**

| Area                          | Untested Paths                                               | Risk   | Recommended Tests                                                                                                                  |
| ----------------------------- | ------------------------------------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Config Validation**         | Missing fields, invalid registry URLs, malformed image names | MEDIUM | `should validate required fields`, `should reject invalid image registries`, `should handle missing optional fields with defaults` |
| **Docker Registry Overrides** | Custom registry in docker-compose, GHCR image pulling        | LOW    | `should build image URLs correctly for custom registry`, `should format GHCR images with owner prefix`                             |
| **Mobile Bundle IDs**         | Custom app identifiers for forked app                        | LOW    | `should generate correct Android package names`, `should generate correct iOS bundle IDs`                                          |

**Test Implementation Notes:**

- Create a schema validator utility (`src/utils/branding-validator.ts`) with tests
- Config tests are unit-only (no DB needed)
- Validate at startup (add to `SystemConfigService`)

---

### 1.3 Pet Detection (Critical Gaps Only)

**Current Coverage:**

- `pet-detection.service.spec.ts` — exists

**Critical Gaps:**

| Area               | Untested Paths                                          | Risk   | Recommended Tests                                                                                                         |
| ------------------ | ------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| **Model Loading**  | Missing ONNX model file, network error fetching from HF | HIGH   | `should handle missing model gracefully`, `should retry on network error`, `should fall back to yolo11n if yolo11s fails` |
| **Error Handling** | Invalid image format, OOM during inference              | MEDIUM | `should skip detection on unsupported image types`, `should log and continue on OOM`                                      |

**Test Implementation Notes:**

- Mock model download (don't hit HuggingFace in tests)
- Existing service tests likely cover happy path; focus on error recovery

---

### 1.4 Image Editing (Critical Gaps Only)

**Current Coverage:**

- `editor.spec.ts` — rotation logic
- `media.service.spec.ts` — partial (apply edits, thumbnail refresh)
- Medium tests: `asset-edit.repository.spec.ts`, `sync-asset-edit.spec.ts` — exist

**Critical Gaps:**

| Area                     | Untested Paths                                         | Risk   | Recommended Tests                                                  |
| ------------------------ | ------------------------------------------------------ | ------ | ------------------------------------------------------------------ |
| **Thumbnail Corruption** | Applying edits with stale thumbhash causing cache miss | MEDIUM | Already tested in PR #18; verify `invalidateThumbnail()` is called |
| **Rotation with EXIF**   | Combining user rotation with original EXIF orientation | LOW    | `should handle rotation=90° + EXIF=90° correctly`                  |

**Test Implementation Notes:**

- Coverage gaps here are minor; mostly already tested
- Verify sync tests cover edited assets appearing in timeline

---

### 1.5 Google Photos Import (Critical Gaps Only)

**Current Coverage:**

- Web layer: parser/scanner/uploader/manager all have unit tests
- No server-side changes (client uploads via existing API)

**Critical Gaps:**

| Area                   | Untested Paths                                    | Risk   | Recommended Tests                        |
| ---------------------- | ------------------------------------------------- | ------ | ---------------------------------------- |
| **Sidecar Parsing**    | Already tested in `google-takeout-parser.spec.ts` | LOW    | None needed                              |
| **Album Organization** | Creating albums from `Photos from YYYY` structure | MEDIUM | Already tested in scanner; verify in E2E |

**Test Implementation Notes:**

- Server has no new code; all testing is web-layer (covered below)

---

## Part 2: Web Layer Tests

### 2.1 Shared Spaces (Comprehensive)

**Current Coverage:**

- Component tests exist: `space-*.spec.ts` (12+ components)
- Manager tests: None found
- E2E tests: `spaces-p1/p2/p3.e2e-spec.ts` (3 specs covering features, not all flows)

**Critical Gaps:**

| Area                     | Untested Paths                                                             | Risk   | Recommended Tests                                                                                                                         |
| ------------------------ | -------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **SpacesManager**        | No manager unit tests for state management                                 | HIGH   | Create `spaces-manager.spec.ts`: `should sync space list`, `should update local space on member join`, `should handle concurrent invites` |
| **Timeline Integration** | Toggling `showInTimeline` updates personal timeline                        | HIGH   | `should add space assets to timeline on toggle`, `should remove on toggle back`, `should preserve asset order`                            |
| **Member Permissions**   | UI disables actions based on role (edit/delete/invite only for ADMIN/EDIT) | MEDIUM | `should hide edit button for VIEWER role`, `should show share-member button only for ADMIN`, `should disable asset delete for non-owners` |
| **Activity Feed**        | Real-time activity updates via Socket.IO                                   | MEDIUM | `should render activities in order`, `should update member contribution stats`, `should show "new since last visit" banner`               |
| **Onboarding Banner**    | 3-step flow: add photos, invite members, set cover                         | MEDIUM | `should hide step 1 when assets exist`, `should progress steps correctly`, `should persist state across navigation`                       |
| **Search Within Space**  | Filtering assets by name/date within space context                         | LOW    | `space-search.spec.ts` — verify pagination, empty state                                                                                   |
| **Cover Photo Handling** | Cropping, repositioning with `thumbnailCropY`                              | LOW    | `should render crop handles`, `should update position on drag`, `should use preview image not thumb`                                      |
| **Sort Options**         | Sorting by date, name, recent activity (with i18n labels)                  | LOW    | `should render all 3 sort options`, `should update assets when sort changes`                                                              |
| **Responsive Design**    | Mobile vs. desktop layout, collapsing members panel                        | LOW    | Component snapshots or visual regression tests                                                                                            |

**E2E Test Gaps:**

- Current: `spaces-p1.e2e-spec.ts` (creation, member invite), `spaces-p2.e2e-spec.ts` (asset management), `spaces-p3.e2e-spec.ts` (activity feed)
- Missing: `should sync space in timeline after adding asset`, `should update member count on leave`, `should handle concurrent edits` (stress test)

**Test Implementation Notes:**

- Create `spaces-manager.spec.ts` mocking `SpacesApi` and Socket.IO events
- For permission tests, use user stubs with different roles
- Timeline integration tests need to mock the `TimelineManager` and verify asset filtering logic
- Add Socket.IO event mocks to manager tests for real-time activity
- E2E tests should verify full flows (invite → join → add asset → see in timeline)

**Dependencies:**

- Requires server to expose space member permission checks (tested above)
- Requires timeline service to filter by space membership

---

### 2.2 Gallery Branding (Comprehensive)

**Current Coverage:**

- `Logo.svelte` — no tests
- `LoadingSpinner.svelte` — no tests
- Theme overrides in `@immich/ui` integration — untested

**Critical Gaps:**

| Area                  | Untested Paths                                           | Risk   | Recommended Tests                                                                                                                                                 |
| --------------------- | -------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Logo Component**    | Rendering dark/light/night variants, fallback to default | HIGH   | Create `Logo.spec.ts`: `should render Gallery logo by default`, `should switch variant on theme change`, `should fallback to Immich logo if Gallery logo missing` |
| **LoadingSpinner**    | Animated SVG rendering, theme color changes              | MEDIUM | Create `LoadingSpinner.spec.ts`: `should render animation`, `should apply theme colors`                                                                           |
| **Theme Integration** | Detecting dark mode, updating UI on toggle               | MEDIUM | `should respond to theme service changes`, `should persist theme preference`                                                                                      |
| **Favicon & PWA**     | favicon.ico, manifest.json with custom branding          | LOW    | `should serve custom favicon`, `should use custom app name in manifest`                                                                                           |
| **Conditional Logo**  | `<picture>` element for GitHub dark mode (README)        | LOW    | Markdown/doc test (not code)                                                                                                                                      |

**Test Implementation Notes:**

- Mock the theme service (already in place from `@immich/ui`)
- Use component snapshots for logo variants (light/dark/night)
- PWA tests can be simple file existence checks
- No E2E needed for branding (purely visual/cosmetic)

---

### 2.3 Pet Detection (Critical Gaps Only)

**Current Coverage:**

- No web UI components found for pet detector trigger/settings

**Critical Gaps:**

| Area               | Untested Paths                                                  | Risk   | Recommended Tests                                                         |
| ------------------ | --------------------------------------------------------------- | ------ | ------------------------------------------------------------------------- |
| **Detector UI**    | If there's a toggle/settings for pet detection in system config | MEDIUM | Create tests if UI exists; otherwise, no web tests needed                 |
| **Search Results** | Filtering by "pets" tag/label                                   | LOW    | Verify search integration works (may already be tested in search.spec.ts) |

**Test Implementation Notes:**

- Pet detection is mostly server-side ML; minimal web UI
- If settings UI exists, add snapshot + permission tests

---

### 2.4 Image Editing (Critical Gaps Only)

**Current Coverage:**

- Rotation action in viewer: `RotateAction.svelte` — unknown coverage
- Timeline batch rotate: likely covered in timeline tests
- Full editor: unknown coverage

**Critical Gaps:**

| Area                 | Untested Paths                                       | Risk   | Recommended Tests                                                                                                             |
| -------------------- | ---------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| **Rotation UI**      | Quick-rotate button in viewer, state management      | MEDIUM | Create `RotateAction.spec.ts`: `should rotate image 90° on click`, `should send update to server`, `should refresh thumbnail` |
| **Batch Rotate**     | Timeline context menu for bulk rotate                | LOW    | Verify timeline action menu tests cover this                                                                                  |
| **Editor State**     | Opening editor, applying edits, save/cancel          | MEDIUM | Verify existing editor tests cover happy path and errors                                                                      |
| **Thumbnail Update** | After save, old thumbnail in timeline should refresh | MEDIUM | Test `AssetUpdate` event invalidates cache                                                                                    |

**Test Implementation Notes:**

- Use `asset` stub with mock `AssetService`
- Test that thumbnail cache is invalidated (verify `thumbhash` changes)
- E2E test: upload asset → rotate → verify in timeline (already likely covered)

---

### 2.5 Google Photos Import (Critical Gaps Only)

**Current Coverage:**

- `google-takeout-parser.spec.ts` — parser logic
- `google-takeout-scanner.spec.ts` — zip extraction, file scanning
- `google-takeout-uploader.spec.ts` — upload to server
- `import-manager.spec.ts` — state management
- Component tests: 6 step components
- E2E: `google-import.e2e-spec.ts` — full wizard flow

**Critical Gaps:**

| Area                   | Untested Paths                                     | Risk   | Recommended Tests                                                       |
| ---------------------- | -------------------------------------------------- | ------ | ----------------------------------------------------------------------- |
| **Error Recovery**     | Partial upload failure, resume/retry               | MEDIUM | `should skip already-uploaded assets`, `should resume on network error` |
| **Memory Management**  | Large zip files (10GB+), streaming extraction      | LOW    | Load test (outside unit tests); may be integration test                 |
| **Metadata Conflicts** | Same photo in multiple albums, duplicate detection | LOW    | Verify scanner handles duplicates in test data                          |

**Test Implementation Notes:**

- Error recovery tests already exist (verify in `uploader.spec.ts`)
- E2E test covers happy path; no critical gaps
- Memory/performance testing is optional (integration-level)

---

## Part 3: Mobile Layer Tests

### 3.1 Shared Spaces (Comprehensive)

**Current Coverage:**

- `shared_spaces_test.dart` — exists but likely minimal
- Unit tests for space-related services/repositories: unknown coverage
- Patrol E2E: limited (nightly only, slow)

**Critical Gaps:**

| Area                   | Untested Paths                                            | Risk   | Recommended Tests                                                                                                              |
| ---------------------- | --------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| **Space List Screen**  | Display spaces, filter by pinned/recent, join space UX    | HIGH   | Create/expand component tests: `should display space list`, `should show pinned spaces first`, `should display member avatars` |
| **Space Detail Page**  | View space info, member list, asset grid, timeline toggle | HIGH   | `should toggle showInTimeline`, `should display member roles`, `should load assets for space`                                  |
| **Member Permissions** | Role-based UI (ADMIN/EDIT/VIEW), action buttons           | HIGH   | `should hide edit button for VIEWER`, `should show remove-member only for ADMIN`, `should disable asset delete for non-owners` |
| **Activity Feed**      | Real-time activity updates, member contribution stats     | MEDIUM | `should display activities in order`, `should update stats on new activity`                                                    |
| **Join Space**         | Accept invite, request to join (if pending)               | MEDIUM | `should join space on accept invite`, `should show request state while pending`                                                |
| **Asset Management**   | Add/remove assets from space, permission checks           | MEDIUM | `should add asset to space`, `should prevent delete if not owner`, `should remove asset on permission denied`                  |
| **Cover Photo**        | Display cover with thumbnail crop, tap to open viewer     | LOW    | `should render cover with correct aspect ratio`, `should open viewer on tap`                                                   |
| **Navigation**         | Space detail → timeline, asset viewer → space detail      | LOW    | `should navigate back to space list`, `should maintain scroll position`                                                        |

**Unit Test Gaps (Dart services/repositories):**

- `space_repository_test.dart` — verify CRUD operations, queries
- `space_service_test.dart` — state management, sync with server
- `album_service_test.dart` — album handling within spaces
- `timeline_service_test.dart` — space asset filtering in timeline

**Patrol E2E Gaps:**

- Currently in nightly-only test suite (slow)
- Missing: `should create space and add assets`, `should invite member and view activity`, `should join space via invite link`
- Consider moving critical path tests to PR CI (split nightly vs. PR)

**Test Implementation Notes:**

- Use Riverpod testing utilities (already in place)
- Mock space APIs with test data factories
- Component tests use `PumpWidget` with `ProviderContainer` for state
- Patrol tests should follow existing page object pattern (`SpaceDetailPage`, `SpaceListPage`)
- Use `ensureVisible` for off-screen widgets in Patrol tests

**Dependencies:**

- Server space permission checks (tested above)
- Timeline service filtering by space membership
- Socket.IO events for real-time activity

---

### 3.2 Gallery Branding (Comprehensive)

**Current Coverage:**

- Custom logo/loading spinner in app: no tests (visual/config-driven)

**Critical Gaps:**

| Area                   | Untested Paths                                          | Risk   | Recommended Tests                                               |
| ---------------------- | ------------------------------------------------------- | ------ | --------------------------------------------------------------- |
| **App Icon**           | Custom app icon in launcher, icon variants (light/dark) | LOW    | Visual regression test or icon file existence check             |
| **Bundle ID Override** | Custom Android package name, iOS bundle ID              | LOW    | Config test: `should use custom bundle ID from branding config` |
| **Splash Screen**      | Loading spinner animation, theme color                  | MEDIUM | `should render animated spinner`, `should apply theme colors`   |
| **App Name**           | Custom display name in launcher                         | LOW    | Config test and visual verification                             |

**Test Implementation Notes:**

- Mostly config-driven; minimal code testing needed
- Icon tests are visual/system-level (not typical unit tests)
- Splash screen animation test similar to web (use flutter_test)

---

### 3.3 Pet Detection (Critical Gaps Only)

**Current Coverage:**

- Pet detection is server-side ML; minimal mobile exposure

**Critical Gaps:**

| Area              | Untested Paths                                  | Risk | Recommended Tests                                  |
| ----------------- | ----------------------------------------------- | ---- | -------------------------------------------------- |
| **Search Filter** | "Pets" tag appears in search, can filter by it  | LOW  | Verify `SearchService` includes pet tag in results |
| **Asset Labels**  | Pet detection label shown on asset cards/viewer | LOW  | If UI exists, test label rendering                 |

**Test Implementation Notes:**

- Pet detection on mobile is read-only (view search results)
- No critical gaps; server tests sufficient

---

### 3.4 Image Editing (Critical Gaps Only)

**Current Coverage:**

- Unknown if mobile supports image editing

**Critical Gaps:**

| Area                 | Untested Paths                                  | Risk | Recommended Tests                        |
| -------------------- | ----------------------------------------------- | ---- | ---------------------------------------- |
| **Quick Rotate**     | If available in asset viewer, rotate button     | LOW  | `should rotate image and send to server` |
| **Thumbnail Update** | After rotate, timeline thumbnail should refresh | LOW  | Verify refresh via asset update event    |

**Test Implementation Notes:**

- If editing is supported, follow same pattern as web
- If not supported, no tests needed

---

### 3.5 Google Photos Import (Critical Gaps Only)

**Current Coverage:**

- Import is web-only; no mobile implementation

**Critical Gaps:**

| Area                    | Untested Paths | Risk | Recommended Tests |
| ----------------------- | -------------- | ---- | ----------------- |
| None — web-only feature |                |      |                   |

**Test Implementation Notes:**

- Mobile can still import via Immich server (upload existing photos)
- No Google Takeout-specific mobile UI needed

---

### 3.6 Mobile Patrol E2E Test Structure

**Current:**

- 6 integration tests in `integration_test/tests/`: login, permissions, album, backup, search, timeline, shared_spaces
- Runs nightly only (slow, GitHub Actions emulator overhead)

**Recommended:**

- **PR CI (fast path):** Login, permissions (auth critical), shared_spaces basic flow
- **Nightly (comprehensive):** All 6 + new tests for spaces activity, member management

**Test Implementation Notes:**

- Patrol tests use Android Test Orchestrator (each test in separate process)
- Reuse page object patterns from existing tests
- Key pattern: `$.platformAutomator.mobile.*` for native automation, `ensureVisible` for off-screen widgets

---

## Part 4: Cross-Layer Integration Tests

These validate that features work correctly when components from different layers interact.

### 4.1 Shared Spaces + Timeline Sync

**Test Coverage Needed:**

| Scenario                                           | Server               | Web                 | Mobile     | Priority |
| -------------------------------------------------- | -------------------- | ------------------- | ---------- | -------- |
| Add asset to space → appears in personal timeline  | medium test          | manager + E2E       | Patrol E2E | HIGH     |
| Toggle `showInTimeline` → timeline updates         | medium test          | manager + component | Patrol E2E | HIGH     |
| Remove asset from space → disappears from timeline | medium test          | E2E                 | Patrol E2E | MEDIUM   |
| Concurrent space + timeline updates                | medium test (stress) | E2E                 | —          | MEDIUM   |

**How to Test:**

- Server: Create space, add member, add asset, verify timeline query includes it
- Web: Toggle showInTimeline, verify AssetUpdate event → TimelineManager updates
- Mobile: Create space, add asset, verify appears in timeline feed
- E2E: Create space → invite user → user adds asset → verify in personal timeline

---

### 4.2 Shared Spaces + Notifications

**Test Coverage Needed:**

| Scenario                                            | Server                | Web                           | Mobile     | Priority |
| --------------------------------------------------- | --------------------- | ----------------------------- | ---------- | -------- |
| Invite member → notification sent                   | service test + medium | manager (stub notification)   | —          | HIGH     |
| Member added to space → activity created → notified | service test          | E2E (verify activity appears) | Patrol E2E | MEDIUM   |

**How to Test:**

- Server: Mock notification service, verify called on invite
- Web: Stub Socket.IO events, verify activity appears
- Mobile: Patrol test receives invite notification
- E2E: Full flow from invite → notification → activity feed

---

### 4.3 Shared Spaces + Sync

**Test Coverage Needed:**

| Scenario                                    | Server                       | Web                    | Mobile             | Priority |
| ------------------------------------------- | ---------------------------- | ---------------------- | ------------------ | -------- |
| Space member joins → local space list syncs | medium test (FK constraints) | manager (socket event) | Riverpod sync test | MEDIUM   |
| Space deleted → member access denied        | medium test                  | E2E (403 error)        | Patrol E2E         | MEDIUM   |

---

### 4.4 Image Editing + Thumbnail Refresh

**Test Coverage Needed:**

| Scenario                                                          | Server                    | Web                          | Mobile             | Priority |
| ----------------------------------------------------------------- | ------------------------- | ---------------------------- | ------------------ | -------- |
| Rotate asset → thumbhash updates → timeline thumbnail invalidates | service test + medium     | manager (cache invalidation) | asset update event | MEDIUM   |
| Batch rotate → all thumbnails refresh                             | medium test (batch query) | component + E2E              | —                  | LOW      |

---

### 4.5 Pet Detection + Search

**Test Coverage Needed:**

| Scenario                                             | Server       | Web                     | Mobile             | Priority |
| ---------------------------------------------------- | ------------ | ----------------------- | ------------------ | -------- |
| Run pet detection → results searchable by "pets" tag | service test | search integration test | search Patrol test | LOW      |

---

### 4.6 Google Photos Import + Timeline

**Test Coverage Needed:**

| Scenario                                                       | Server                      | Web                    | Mobile | Priority |
| -------------------------------------------------------------- | --------------------------- | ---------------------- | ------ | -------- |
| Import photos with dates → appear in timeline in correct order | medium test (date handling) | E2E (full import flow) | —      | LOW      |
| Import to album → album created correctly                      | service test                | E2E                    | —      | LOW      |

---

## Part 5: Test Utilities & Reusable Patterns

To reduce duplication and speed up test writing, create these shared utilities:

### 5.1 Server Test Utilities

**Already Exist:**

- `newTestService()` factory in `test/utils.ts` — auto-mocks repositories
- `sharedSpaceFactory` — creates test spaces with members

**Needs Creation:**

- `spaceMemberFactory(space, role)` — creates members with specific roles
- `assetEditFactory()` — creates edit records with rotation/crop data
- `spaceActivityFactory(type, actor)` — creates activity records
- Mock `NotificationService` wrapper for easy event assertions

### 5.2 Web Test Utilities

**Already Exist:**

- Component testing with `@testing-library/svelte`
- `asset` stub with mock `AssetService`

**Needs Creation:**

- `SpacesManager` test helpers (mock API, Socket.IO events)
- `spaceFixture(role)` — creates space object with specific member role
- `mockSocketIO` wrapper for E2E space events
- `mockThemeService` for branding tests
- Permission assertion helper: `assertActionDisabledForRole(role, action)`

### 5.3 Mobile Test Utilities

**Already Exist:**

- Riverpod `ProviderContainer` testing helpers
- Patrol page objects for existing screens

**Needs Creation:**

- `SpaceDetailPage`, `SpaceListPage` page objects (Patrol)
- `spaceFixture(role)` — Dart test data factory
- `mockSpaceApi` wrapper for unit tests
- Patrol helper for async operations: `waitForActivityFeed()`

### 5.4 E2E/Playwright Utilities

**Needs Creation:**

- `createSpaceAndInvite(ownerPage, memberPage)` — full invite flow
- `uploadAssetToSpace(space)` — add asset in context
- `verifyTimelineIncludes(assetId)` — assertion helper

---

## Summary

This design provides a structured, layer-by-layer testing roadmap:

1. **Shared Spaces** — Most complex; spans all layers; high-priority (timeline sync, permissions)
2. **Gallery Branding** — Medium complexity; mostly config/UI; lower priority
3. **Mobile Integration** — Framework tests; improves overall reliability; medium priority
4. **Critical gaps** — Pet Detection, Image Editing, Google Import; targeted, lower effort

The layered approach allows you to tackle tests in dependency order (server → web → mobile) and provides reusable utilities to avoid duplication.

---

## Next Steps

The writing-plans skill will create a detailed, task-oriented implementation plan with:

- Suggested PR structure
- Task sequencing and dependencies
- Effort estimates per feature
- Testing strategy (which tests to write first for maximum ROI)
