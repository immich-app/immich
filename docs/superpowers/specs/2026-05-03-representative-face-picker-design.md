# Representative Face Picker Design

## Context

People currently have representative thumbnails, but the UI mostly selects them by photo asset rather than by exact detected face. In a multi-person photo, that leaves room for ambiguity. The global People detail page has a "select featured photo" flow that sends `featureFaceAssetId` and lets the backend choose the matching face on that asset. Space People already store `shared_space_person.representativeFaceId`, but there is no equivalent picker in the space UI.

The current identity work also means a space person may be linked to a personal person, but the personal representative face is not always usable inside a space. If the personal thumbnail is based on a photo that is not in the space, the space context needs a space-specific representative face.

## Goals

- Let users choose the exact detected face crop used as a representative face.
- Support both personal People and Space People.
- Preserve the existing default behavior where space people reuse an accessible personal thumbnail.
- Allow a space person to override the inherited personal thumbnail with a face from that space.
- Prevent background repair, dedup, or backfill jobs from overwriting an explicit space choice while it remains valid.
- Validate that selected faces are accessible and belong to the relevant person or identity.

## Non-Goals

- Reworking face detection, clustering, or identity linking.
- Adding a bulk representative-face editor.
- Adding an asset viewer shortcut as the primary implementation. That can be a follow-up shortcut.
- Allowing a space representative face to come from an asset outside that space.

## User Experience

Both personal and space person detail pages get a "Select representative face" action in the person menu.

When selected, the app opens a dedicated face-crop picker for that person. The picker shows a paginated grid of detected face crops, each representing one `asset_face.id`. Selecting a tile immediately updates the representative face, closes the picker, refreshes the person data, and causes the displayed thumbnail URL to change via `updatedAt` or cache-busting.

For personal people, the picker lists visible faces that belong to the personal person or its linked identity.

For space people, the picker lists visible faces assigned to that space person and backed by assets in that space. Editors and owners can choose a space override. Viewers can see the current thumbnail but cannot change it.

Space people follow this thumbnail precedence:

1. If the space person has a valid manual representative face override, render that exact face crop.
2. Otherwise, if the viewer has access to a personal thumbnail for the linked identity, serve that personal thumbnail.
3. Otherwise, render the space person's automatic `representativeFaceId`.
4. Otherwise, return 404 and let the UI fall back to its existing no-thumbnail behavior.

If a space override exists, the picker includes a "Use inherited thumbnail" action. This clears the manual override and returns the space person to the normal inherited/automatic thumbnail behavior.

## API Design

Add a face-picker DTO that exposes enough data to render exact face crops:

```ts
type PersonFaceResponseDto = {
  id: string;
  assetId: string;
  isRepresentative: boolean;
  imageWidth: number;
  imageHeight: number;
  boundingBoxX1: number;
  boundingBoxY1: number;
  boundingBoxX2: number;
  boundingBoxY2: number;
  fileCreatedAt?: string;
};

type PersonFacePageResponseDto = {
  faces: PersonFaceResponseDto[];
  hasNextPage: boolean;
};
```

Add update DTOs:

```ts
type RepresentativeFaceUpdateDto = {
  assetFaceId: string;
};

type SpaceRepresentativeFaceUpdateDto = {
  assetFaceId: string | null;
};
```

Personal endpoints:

- `GET /people/:id/faces?page=&size=`
- `PUT /people/:id/representative-face`
- `GET /people/:id/faces/:faceId/thumbnail`

Space endpoints:

- `GET /shared-spaces/:spaceId/people/:personId/faces?page=&size=`
- `PUT /shared-spaces/:spaceId/people/:personId/representative-face`
- `GET /shared-spaces/:spaceId/people/:personId/faces/:faceId/thumbnail`

The existing `featureFaceAssetId` field can remain for compatibility. New UI should use the exact-face endpoints.

The face-list endpoints return `PersonFacePageResponseDto` and mark the current representative row with `isRepresentative`. The update endpoints return the updated `PersonResponseDto` or `SharedSpacePersonResponseDto`. `SharedSpacePersonResponseDto` should expose `representativeFaceSource` so the UI can show or hide the reset-to-inherited action without making an extra request.

The face-crop thumbnail endpoints should share the same validation as their picker list. They exist so the frontend does not need to load full assets or do canvas cropping for a paginated grid. The web app should derive the thumbnail URL from the current scope and `face.id`, matching the existing `getPeopleThumbnailUrl` pattern instead of requiring API DTOs to contain web-specific URLs.

## Backend Behavior

### Personal People

Updating a personal representative face:

1. Requires `person.update` access to the person.
2. Requires read access to the selected face's asset.
3. Verifies the face is visible, not deleted, and belongs to the requested person or its linked identity.
4. Updates `person.faceAssetId` to the selected `assetFaceId`.
5. If the person has an identity, updates `face_identity.representativeFaceId` to the same face when the face belongs to that identity.
6. Queues `PersonGenerateThumbnail` for the personal person.

The generated personal person thumbnail remains the source reused by spaces when accessible.

### Space People

Add a column to `shared_space_person`:

```ts
representativeFaceSource: 'auto' | 'manual';
```

The default is `auto`.

Updating a space representative face:

1. Requires editor or owner role in the space.
2. Verifies the space person belongs to the space.
3. If `assetFaceId` is `null`, clears the manual override by setting `representativeFaceSource = 'auto'`. If the current `representativeFaceId` is still valid for the space person, it is kept as the automatic fallback; otherwise, the service selects the first valid visible face for that space person.
4. If `assetFaceId` is present, verifies the face is visible, not deleted, assigned to that space person, and backed by an asset in the space.
5. Updates `shared_space_person.representativeFaceId` and sets `representativeFaceSource = 'manual'`.
6. Updates `face_identity.representativeFaceId` when the space person has an identity and the selected face belongs to that identity.

Space person thumbnails are rendered on demand from the selected face crop, as they are today for non-personal fallback thumbnails.

## Background Jobs

Jobs that repair or choose space representative faces must preserve manual choices while the chosen face remains valid.

- `repairOrphanedRepresentativeFaces` only changes rows whose source is `auto`, or rows whose manual face no longer exists, is hidden, is deleted, or is no longer in the space.
- Shared-space dedup only refreshes the target `representativeFaceId` automatically when the target source is `auto`.
- Space identity backfill only sets `representativeFaceId` for existing rows when the source is `auto` or the current value is null.
- If a manual face is removed from the space, the override is cleared to `auto` and the space falls back to inherited or automatic behavior.

Personal representative faces can already be replaced when the selected face is reassigned away or deleted. That behavior should continue so thumbnails do not point at invalid faces.

## Frontend Components

The frontend direction should be a quiet, dense contact-sheet picker that fits the existing Gallery People UI. This is an operational correction flow, not a decorative gallery surface: the user should be able to scan many face crops quickly, see the current representative at a glance, and make one precise change with minimal ceremony.

Add `web/src/lib/modals/RepresentativeFacePickerModal.svelte` as the shared modal used by both person detail pages. It should receive:

- a loader for paginated face data,
- an update callback,
- selected state from `PersonFaceResponseDto.isRepresentative`,
- optional reset callback for space overrides,
- permission state for disabling actions.

Use `@immich/ui` `Modal` and `ModalBody` to match existing picker modals. Use a large modal on desktop and let it behave as a tall, scrollable picker on mobile. The modal should keep stable dimensions: no tile should resize when images load, selection changes, or errors appear.

Add `web/src/lib/components/people/representative-face-tile.svelte`. Each tile should:

- render a square face crop from a thumbnail URL derived by the modal,
- use `ImageThumbnail` for loading/error behavior where possible,
- use a visible selected ring and check icon for `isRepresentative`,
- show no overlaid labels by default because the grid contains one person's faces,
- include an accessible label such as `select_representative_face`,
- keep a fixed 7-8px radius, matching existing card/tile treatment,
- disable itself and show a subtle busy state while its update request is in flight.

The modal should include:

- a compact title using `select_representative_face`,
- a grid with responsive fixed-size tracks: about 88-96px tiles on mobile and 104-120px tiles on desktop,
- an initial skeleton grid while loading,
- a "load more" footer button when `hasNextPage` is true,
- a single reset action for spaces when `representativeFaceSource === 'manual'`,
- an empty state only when there are no selectable faces,
- toast/error handling using existing `handleError` and `toastManager` patterns.

Avoid visible instructional copy. The controls should be self-explanatory through title, selected state, reset action, and accessible labels.

Personal detail page changes:

- Rename or replace "Select featured photo" with "Select representative face".
- Open `RepresentativeFacePickerModal` instead of entering timeline single-select mode.
- On success, update the local `person` response and thumbnail URL.
- Remove the now-unused person-detail `SELECT_PERSON` timeline mode once the modal flow replaces it.
- Keep the existing `featureFaceAssetId` SDK path only for backward compatibility and asset-viewer shortcuts.

Space detail page changes:

- Add "Select representative face" to the editor/owner menu.
- Open `RepresentativeFacePickerModal` with space-scoped face data.
- On success, update the local `person` response and thumbnail URL.
- Show "Use inherited thumbnail" inside the picker when a manual override exists.

Call the generated SDK directly from the detail pages and pass small loader/update callbacks into the modal. Add URL helpers in `web/src/lib/utils/people-utils.ts`:

- `getPersonFaceThumbnailUrl(personId, faceId, updatedAt?)`
- `getSpacePersonFaceThumbnailUrl(spaceId, personId, faceId, updatedAt?)`

Add i18n keys at minimum:

- `select_representative_face`
- `representative_face_updated`
- `use_inherited_thumbnail`
- `representative_face_inherited`
- `no_faces_found`
- `errors.unable_to_load_faces`
- `errors.unable_to_update_representative_face`

## Validation Rules

Reject a representative-face update when:

- the face id does not exist,
- the face is deleted,
- the face is not visible,
- the face's asset is deleted or offline,
- the actor cannot read the asset,
- the face belongs to another personal person or identity,
- the space face is not assigned to the requested space person,
- the space face's asset is not in the space,
- the actor is not an editor or owner for the space endpoint.

## TDD Plan

Use TDD for the implementation. Each backend or frontend slice starts with a failing test that describes the new behavior, then the minimal implementation to pass it, then refactor while keeping the test green. Do not implement the modal, endpoints, schema guards, or job guardrails before the corresponding failing tests exist.

Server tests:

- Personal service accepts an exact face belonging to the person and queues `PersonGenerateThumbnail`.
- Personal service rejects a face from another person.
- Personal service rejects an inaccessible or deleted face.
- Personal service updates the linked identity representative face when applicable.
- Space service accepts an exact face assigned to the space person and marks the source manual.
- Space service rejects an out-of-space face.
- Space service rejects a face assigned to another space person.
- Space service clears the manual override when given `assetFaceId: null`.
- Space thumbnail serving prefers manual override before personal thumbnail.
- Space thumbnail serving falls back to accessible personal thumbnail when source is auto.
- Dedup/backfill/repair do not overwrite valid manual representative faces.
- Dedup/backfill/repair clear invalid manual representative faces and restore auto behavior.

Frontend tests:

- `RepresentativeFacePickerModal` renders loading, loaded, selected, empty, error, and load-more states.
- `RepresentativeFacePickerModal` calls the update callback with the exact `assetFaceId` from the clicked tile.
- `RepresentativeFacePickerModal` disables tiles while a representative update is pending.
- `RepresentativeFacePickerModal` shows the reset action only when supplied a reset callback and manual space source.
- Personal person detail opens the face picker from the menu.
- Personal picker selection calls the exact-face update endpoint and refreshes thumbnail state.
- Space person detail shows the action only for editors/owners.
- Space picker selection calls the space exact-face update endpoint.
- Space picker reset calls the clear-override path.
- Existing person-detail tests should assert the old timeline single-select mode is no longer used for representative face selection.

Frontend test order:

1. Add modal component tests against mocked loader/update callbacks.
2. Add personal page test proving menu action opens the modal with personal callbacks.
3. Add space page tests proving editor-only action, space callbacks, and reset callback behavior.
4. Add thumbnail tile tests for selected state, failed image fallback, fixed sizing classes, and accessible labels.

Run the focused frontend tests first, then the relevant server tests, then the normal server/web checks before pushing.

## Rollout

This can ship behind normal PR review without a feature flag. The new endpoints are additive, and the existing `featureFaceAssetId` update path remains compatible for older clients. The only schema migration is the space representative source column with a default of `auto`.
