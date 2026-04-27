# Map Provider Links In Image Info Panel

## Summary

Add Google Maps and Apple Maps links to the web image info panel's existing map marker popup while preserving the current OpenStreetMap link.

## Motivation

Discussion #432 asks for quick access to mainstream map providers from an asset's GPS location. The image info panel already shows a map preview and an OpenStreetMap link, but Google Maps and Apple Maps are more useful for finding landmarks, restaurants, and other establishments.

## Scope

- Add the links only in the web asset image info panel map popup.
- Preserve the existing OpenStreetMap link.
- Do not change the global map page.
- Do not change mobile behavior. Mobile already prefers native map handling through Android `geo:` links and Apple Maps before falling back to OpenStreetMap.
- Do not add provider preferences, geocoding changes, or API changes.

## UX

When an asset has GPS coordinates and the map feature flag is enabled, the image info panel continues to show the embedded map preview. Opening the marker popup shows:

- Coordinate text
- Open in Google Maps
- Open in Apple Maps
- Open in OpenStreetMap

All provider links open in a new browser tab and use `rel="noopener noreferrer"`.

## Architecture

Provider URL construction lives in `web/src/lib/utils/exif-utils.ts` so provider-specific URL syntax is covered by focused unit tests. The Svelte detail panel receives already-built provider link objects and only renders the popup markup.

The helper API is:

- `getGoogleMapsUrl(lat, lon)`
- `getAppleMapsUrl(lat, lon)`
- `getOpenStreetMapUrl(lat, lon)`
- `getMapProviderLinks(lat, lon)`

`getMapProviderLinks` returns typed entries with stable provider keys, translation labels, and URLs. The detail panel keys the Svelte `{#each}` block by provider key.

## Data Flow

The existing `latlng` derived value in `detail-panel.svelte` remains the source of coordinates. The map preview passes a marker into the popup snippet. The popup reads `marker.lat` and `marker.lon`, calls `getMapProviderLinks`, and renders each provider link.

No API or DTO changes are required.

## Error Handling

No new runtime error path is needed. The popup only renders inside the existing map preview path, which already requires usable coordinates and the map feature flag.

## Testing

Coverage is split across helper and component tests:

- `web/src/lib/utils/exif-utils.spec.ts` verifies URL construction for Google Maps, Apple Maps, OpenStreetMap, and negative coordinates.
- `web/src/lib/components/asset-viewer/detail-panel.spec.ts` verifies the image info panel popup renders Google, Apple, and OpenStreetMap links with the expected URLs and external-link attributes.
- `web/src/test-data/mocks/map-component.stub.svelte` renders the provided popup snippet for the first marker so the detail panel test can assert popup contents without loading MapLibre.

## Files Changed

| File                                                       | Change                                          |
| ---------------------------------------------------------- | ----------------------------------------------- |
| `web/src/lib/utils/exif-utils.ts`                          | Add map provider URL helpers                    |
| `web/src/lib/utils/exif-utils.spec.ts`                     | Add helper URL coverage                         |
| `web/src/lib/components/asset-viewer/detail-panel.svelte`  | Render all provider links in the map popup      |
| `web/src/lib/components/asset-viewer/detail-panel.spec.ts` | Add image info panel provider link coverage     |
| `web/src/test-data/mocks/map-component.stub.svelte`        | Render popup snippets in map component tests    |
| `i18n/en.json`                                             | Add Google Maps and Apple Maps translation keys |
