# People Face Statistics Design

Date: 2026-05-06

## Context

The people and space-people headers currently expose a visible people count, but users also need the number of detected face observations in the same scope. That face count is important when comparing import progress, admin/user visibility, and shared-space consistency.

The UI must keep the first page load cheap. Detailed diagnostics are useful, but they should only load when the user explicitly asks for them.

This design covers global people, space people, global person detail, and space-person detail statistics. Implementation should happen in separate TDD plans, one plan per phase below.

## Goals

- Show a primary detected-face count next to the visible people count on global people and space people pages.
- Keep detailed face diagnostics behind a lazy info action.
- Use consistent API shapes for global and shared-space people statistics.
- Include person-detail and space-person-detail face counts for consistency.
- Count linked/external-library photos when they are part of the current accessible scope.
- Prevent stats from leaking inaccessible people, faces, assets, spaces, or linked libraries.
- Require TDD for each implementation phase, with red tests written before production code.

## Non-Goals

- Do not change identity merge or reconciliation rules.
- Do not expose raw face identity IDs in statistics responses.
- Do not build a separate admin diagnostics dashboard in this work.
- Do not make the detailed diagnostics load on initial page render.

## Terminology

- **Header person count**: count of visible person identities in the current scope, derived from `total - hidden`.
- **Overview total**: count of all eligible person identities in the current scope, including visible and hidden people.
- **Face count**: count of detected face observations, not distinct people.
- **Primary face count**: count of all detected face observations in the current accessible scope.
- **Detected faces**: all detected face observations in the current accessible asset scope.
- **Assigned visible faces**: detected faces assigned to visible people in the current scope.
- **Assigned hidden faces**: detected faces assigned to hidden people in the current scope.
- **Unassigned faces**: detected faces that are not assigned to a visible or hidden person in the current scope.

## User Model

The header should answer the fast comparison question:

```text
People (60) · 2,901 faces  [i]
```

The info action should answer the diagnostic question:

```text
2,901 detected faces
2,843 assigned to visible people
42 assigned to hidden people
16 unassigned
```

For a shared space:

```text
Space People (14) · 1,980 faces  [i]
```

```text
1,980 detected faces in this space
1,930 assigned to visible space people
35 assigned to hidden space people
15 unassigned
```

## Scope Rules

Global people statistics use the same accessible scope as the global people page:

```text
user-owned library assets
+ shared-space assets visible in the user's timeline
+ linked/external-library assets exposed through visible timeline spaces
```

Space people statistics use only the selected shared space:

```text
direct assets in the shared space
+ linked/external-library assets attached to that shared space
```

Person-detail statistics use the accessible identity represented by the person route. They must include the user's accessible assets for that identity and must not count inaccessible assets after access changes such as leaving a space.

Space-person-detail statistics use only the selected shared space and selected person identity.

Each face observation must be counted at most once per response, by stable face ID. Each asset must be considered at most once per response, even when it is reachable through more than one access path, such as owned library plus shared space, multiple shared spaces, or direct space asset plus linked/external library.

Each eligible person identity must be counted at most once per response. If personal and shared-space person rows resolve to the same accessible identity, the people `total` counts that identity once. The visible header person count is derived as `total - hidden`.

All counts are backend aggregates. The frontend must not derive these numbers from loaded grid rows, because pagination and lazy loading would make the counts incorrect.

## API Design

Keep list endpoints as list endpoints:

```text
GET /people
GET /shared-spaces/:spaceId/people
```

Add or extend global statistics endpoints:

```text
GET /people/statistics
GET /people/face-statistics
GET /people/:personId/statistics
```

Add or extend shared-space statistics endpoints:

```text
GET /shared-spaces/:spaceId/people/statistics
GET /shared-spaces/:spaceId/people/face-statistics
GET /shared-spaces/:spaceId/people/:personId/statistics
```

The web route may still be `/spaces/:spaceId/...`; the server API should use the existing `shared-spaces` prefix.

### Overview Statistics

Overview statistics are safe for initial page load.

```ts
type PeopleOverviewStatistics = {
  total: number; // all eligible people, visible + hidden
  hidden: number; // hidden people subset of total
  detectedFaceCount: number; // all detected in-scope faces
};
```

`total` and `hidden` preserve the existing people-statistics naming. `total` is the full eligible people count, `hidden` is the hidden subset, and the visible header count is `total - hidden`. `detectedFaceCount` is explicit because the header's face number is all detected in-scope faces, not only assigned visible faces.

### Detailed Face Statistics

Detailed face statistics are lazy-loaded only after the info action is used.

```ts
type PeopleFaceStatistics = {
  detectedFaceCount: number;
  assignedVisibleFaceCount: number;
  assignedHiddenFaceCount: number;
  unassignedFaceCount: number;
};
```

The invariant is:

```text
detectedFaceCount =
  assignedVisibleFaceCount
+ assignedHiddenFaceCount
+ unassignedFaceCount
```

Each endpoint should only query the already-authorized scope, so inaccessible/out-of-scope faces are excluded before classification and are never visible to the response builder.

### Person Detail Statistics

Person detail statistics should extend the existing response:

```ts
type PersonStatistics = {
  assets: number;
  faces: number;
};
```

For global person routes, `faces` counts accessible face observations for the route identity in the global scope.

For space-person routes, `faces` counts face observations for the route identity within that shared space.

## UI Design

Initial global people page load:

```text
/people page
  -> load people list
  -> load GET /people/statistics
  -> render "People (N) · M faces [i]"
```

Initial space people page load:

```text
/spaces/:spaceId/people page
  -> load space people list
  -> load GET /shared-spaces/:spaceId/people/statistics
  -> render "People (N) · M faces [i]"
```

Info action:

```text
[i] click
  -> show loading state
  -> load matching /face-statistics endpoint
  -> render detected/visible/hidden/unassigned details
```

The info action must be an accessible icon button with a useful label. Desktop may use a popover. Mobile may use a compact dialog or sheet if a popover would be cramped.

Detailed stats should be cached for the current query scope and reused if the user closes and reopens the info UI. The cache key must include at least user, route scope, space ID when present, and active people filters.

## Filter Behavior

Statistics must follow the visible page scope. If the people list is filtered by supported query parameters, the statistics request must receive the same filters so the header remains honest.

Required filters are the filters already supported by each page's people list. An implementation plan must list the exact filter parameters it supports. If a page has an active filter that the statistics endpoint cannot support yet, the UI must either hide the filtered face count or label it explicitly as an unfiltered total for the broader scope. It must not present unfiltered face totals as if they described the filtered people list.

## Access Rules

- A user can only fetch global statistics for their own accessible global scope.
- A user can only fetch shared-space statistics for spaces they can access.
- Leaving a shared space removes that space and its linked-library assets from the user's accessible stats.
- A user's own assets must remain counted through their personal/global scope after they leave a space.
- Linked/external libraries count only when exposed through the current authorized scope.
- Deleted, trashed, or otherwise non-visible assets must follow the same visibility rules as the page being summarized.

## Alternatives Considered

### Add Face Counts To List Responses

Rejected. People list responses are paginated and optimized for rows/cards. Adding aggregate face counts there would make list fetching heavier and would encourage frontend code to mix row data with aggregate scope data.

### Symmetric Statistics Endpoints With Lazy Details

Selected. This keeps initial page load small, gives the mobile header the missing at-a-glance face count, and gives diagnostics only when requested.

### Separate Diagnostics Page

Deferred. A diagnostics page may be useful later, but it does not solve the normal header comparison workflow.

## Implementation Plan Boundaries

Each phase below should become its own implementation plan. Each plan must use TDD:

```text
1. Write focused failing tests.
2. Confirm the tests fail for the expected reason.
3. Implement the smallest production change.
4. Run the focused tests.
5. Add edge-case tests before broadening behavior.
6. Commit only the completed phase.
```

### Phase 1: Backend Overview Statistics

Scope:

- `GET /people/statistics`
- `GET /shared-spaces/:spaceId/people/statistics`
- repository/service aggregate methods behind those endpoints

Required tests:

- global overview counts total people, hidden people, and detected in-scope faces
- global overview includes hidden people in `total` and their detected faces in `detectedFaceCount`
- global overview includes unassigned detected faces in `detectedFaceCount`
- shared-space overview counts only the selected space
- shared-space overview includes linked/external-library photos attached to that space
- overview counts each face once when an asset is reachable through owned library and shared space
- overview counts each face once when an asset is reachable as both a direct space asset and linked/external-library asset
- overview counts an accessible resolved identity once when personal and shared-space person rows represent the same identity
- shared-space overview counts a person once when multiple space assets resolve to the same identity
- non-members cannot read shared-space overview statistics
- deleted/trashed/non-visible assets are excluded according to existing page visibility rules
- aggregate counts are independent of pagination
- empty library returns zero people, zero hidden people, and zero detected faces
- empty shared space returns zero people, zero hidden people, and zero detected faces
- all-hidden people return `total === hidden`, derive zero visible people, and still report detected faces

### Phase 2: Lazy Detailed Face Statistics

Scope:

- `GET /people/face-statistics`
- `GET /shared-spaces/:spaceId/people/face-statistics`
- detailed count aggregation for detected, visible-assigned, hidden-assigned, and unassigned faces

Required tests:

- global detailed stats split visible, hidden, and unassigned faces correctly
- space detailed stats split visible, hidden, and unassigned faces correctly
- detailed stats sum back to the primary overview `detectedFaceCount`
- hidden faces are included in primary overview `detectedFaceCount` and separately classified as hidden in detailed stats
- unassigned faces are included in primary overview `detectedFaceCount` and separately classified as unassigned in detailed stats
- linked/external-library faces appear only when in authorized scope
- inaccessible spaces and libraries cannot be inferred from detailed counts
- detailed stats count each face once across overlapping access paths
- rerunning the same query is deterministic and has no side effects
- all faces unassigned returns detected count with zero assigned visible and hidden counts

### Phase 3: Frontend Overview Header

Scope:

- global people header
- shared-space people header
- client query hooks/API SDK updates

Required tests:

- global people page renders people count and detected face count
- shared-space people page renders people count and detected face count
- mobile/header layout keeps both counts visible
- detailed face-statistics endpoint is not called on initial render
- active supported filters are passed to overview statistics endpoints
- unsupported active filters hide or clearly relabel the face count instead of showing a misleading filtered value
- overview loading and error states do not break the people list

### Phase 4: Frontend Lazy Detail UI

Scope:

- reusable stats/info UI if existing structure supports it
- global people lazy detail action
- shared-space people lazy detail action
- client query hooks/API SDK updates for detailed face statistics

Required tests:

- info action is an accessible icon button with a useful label
- clicking info calls the detailed endpoint and renders the diagnostic split
- closing and reopening the info UI uses cached details for the same scope
- changing space/filter scope invalidates the cached detail query
- detailed loading and error states are handled without hiding the primary people/face counts
- desktop presentation fits the header without overlap
- mobile presentation keeps the header counts visible and shows details in a usable compact popover, dialog, or sheet

### Phase 5: Person Detail Statistics

Scope:

- extend `GET /people/:personId/statistics`
- add `GET /shared-spaces/:spaceId/people/:personId/statistics` if not already present
- person detail UI/client usage where applicable

Required tests:

- global person detail returns `assets` and `faces`
- global person detail resolves accessible identity rather than blindly counting a raw row
- space-person detail returns `assets` and `faces` scoped to the selected space
- leaving a space removes inaccessible space assets from global detail stats while preserving the user's owned assets
- non-members cannot read space-person detail statistics
- linked/external-library assets count for space-person detail only when attached to the selected authorized space
- person with zero accessible assets returns zero assets and zero faces

### Phase 6: Edge-Case Hardening And Verification

Scope:

- fill gaps found during phases 1-5
- CI-focused verification
- docs/API consistency checks

Required tests:

- filtered people pages pass matching supported filters to stats endpoints
- same person represented through personal and shared-space identities is counted once in overview people totals
- stats remain stable after reconciliation jobs rerun
- stats remain stable when uploads and shared-space materialization run in different orders
- external/linked-library photo fixtures are covered in both global and space scopes
- OpenAPI/client generated types match the server DTOs

## Rollout Notes

- The primary header face count should be safe to ship once phase 1 and phase 3 are complete.
- The info action should be hidden or disabled until phase 2 and phase 4 are complete.
- Person-detail face counts can ship after phase 5 without blocking the overview header work.
- If implementation is split across PRs, each PR should leave the UI internally consistent and avoid exposing controls whose backend endpoint is not ready.

## Acceptance Criteria

- Global people and space people pages show both visible people count and detected face count.
- Detailed face diagnostics load only after the info icon is clicked.
- Global, space, global-person, and space-person statistics use consistent contracts.
- Linked/external-library photos are counted only in authorized scopes.
- Hidden and unassigned faces are included in the primary detected-face total and broken out in diagnostics.
- Tests cover backend aggregation, access control, external libraries, frontend lazy loading, caching, and mobile/header visibility.
- Each implementation phase has its own TDD plan before production code is changed.
