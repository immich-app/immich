# Map Provider Links Implementation Plan

**Goal:** Add Google Maps and Apple Maps links to the web image info panel's existing map popup while preserving the OpenStreetMap link.

**Design doc:** `docs/plans/2026-04-27-map-provider-links-design.md`

**Architecture:** Put provider URL construction in tested helpers in `web/src/lib/utils/exif-utils.ts`. Use those helpers from `web/src/lib/components/asset-viewer/detail-panel.svelte` so the Svelte component only renders provider links and does not own provider URL syntax.

**Tech stack:** Svelte 5, TypeScript, Vitest, Testing Library Svelte, svelte-i18n, `URL`, `URLSearchParams`.

## Task 1: Add Map Provider URL Helpers

**Files:**

- `web/src/lib/utils/exif-utils.ts`
- `web/src/lib/utils/exif-utils.spec.ts`

1. Add failing unit coverage for:
   - Google Maps coordinate search URL.
   - Apple Maps coordinate URL.
   - OpenStreetMap URL preserving existing marker and map fragment behavior.
   - Combined provider links for negative coordinates.
2. Implement:
   - `getGoogleMapsUrl(lat, lon)`
   - `getAppleMapsUrl(lat, lon)`
   - `getOpenStreetMapUrl(lat, lon)`
   - `getMapProviderLinks(lat, lon)`
3. Type provider link labels as the specific translation keys used by the component.
4. Run:

```bash
pnpm --dir web exec vitest run src/lib/utils/exif-utils.spec.ts
```

Expected result: helper tests pass after the implementation is added.

## Task 2: Add Image Info Panel Rendering Coverage

**Files:**

- `web/src/test-data/mocks/map-component.stub.svelte`
- `web/src/lib/components/asset-viewer/detail-panel.spec.ts`

1. Extend the map test stub so it accepts a Svelte `popup` snippet and renders it for the first marker.
2. Add a detail panel component test that builds an asset with GPS coordinates and verifies the popup renders:
   - `open_in_google_maps`
   - `open_in_apple_maps`
   - `open_in_openstreetmap`
3. Assert each link has:
   - The expected provider URL from the helper.
   - `target="_blank"`.
   - `rel="noopener noreferrer"`.
4. Run the new detail panel test before implementation and verify it fails because Google Maps and Apple Maps links are not rendered yet.

```bash
pnpm --dir web exec vitest run src/lib/components/asset-viewer/detail-panel.spec.ts
```

Expected red result: only the existing OpenStreetMap link is present.

## Task 3: Render Provider Links In The Detail Panel

**Files:**

- `web/src/lib/components/asset-viewer/detail-panel.svelte`
- `i18n/en.json`

1. Add English labels:
   - `open_in_google_maps`
   - `open_in_apple_maps`
2. Import `getMapProviderLinks` in `detail-panel.svelte`.
3. Replace the hardcoded OpenStreetMap anchor in the popup with a provider-link loop:
   - Build links from `getMapProviderLinks(lat, lon)`.
   - Key the `{#each}` block by `link.key`.
   - Render `href`, `target="_blank"`, `rel="noopener noreferrer"`, and translated link text.
4. Run:

```bash
pnpm --dir web exec vitest run src/lib/utils/exif-utils.spec.ts src/lib/components/asset-viewer/detail-panel.spec.ts
```

Expected result: helper and component tests pass.

## Task 4: Verification

Run the checks that cover the changed areas and the CI lint path:

```bash
pnpm --dir web run format
pnpm --dir i18n run format
pnpm --dir docs format
pnpm --dir web run lint
pnpm --dir web exec vitest run src/lib/utils/exif-utils.spec.ts src/lib/components/asset-viewer/detail-panel.spec.ts
pnpm --dir open-api/typescript-sdk run build
pnpm --dir web run check:svelte
pnpm --dir web run check:typescript
```

Expected result: all commands exit 0. The focused Vitest run may emit existing Svelte warnings from unrelated modal imports.

## Final PR Review Checklist

- Scope remains limited to the image info panel popup.
- OpenStreetMap behavior remains available.
- Google Maps and Apple Maps links open coordinates directly.
- External links include `target="_blank"` and `rel="noopener noreferrer"`.
- URL syntax is covered by unit tests.
- The detail panel rendering behavior is covered by a component test.
- No mobile, global map page, API, or DTO changes are included.
