# S3 Direct Media Delivery Design

## Problem

The production instance repeatedly gets into a state where asset thumbnails, previews, originals, and person thumbnails stay blurred or never complete. The current deployment stores media in OVH S3 with `IMMICH_S3_SERVE_MODE=proxy`, so browser media requests flow through the Gallery API process:

```text
browser image/video request
  -> service worker intercept for /api/assets/:id/(thumbnail|original)
  -> Gallery API authorization
  -> S3 GetObject stream in the Node process
  -> Express response stream
  -> service worker cloned Response body
  -> browser image/video consumer
```

The observed production failure matches saturation of this stream chain:

- Direct S3 `HeadObject` and pod-local S3 `GetObject` succeed quickly for affected keys.
- Authenticated JSON API endpoints keep working.
- Media endpoints hang with zero response bytes.
- The API process accumulates many open client media sockets.
- A stale S3 socket can remain established with unread bytes.
- Previous attempts to release, abort, idle-timeout, service-worker-retain, and buffer small thumbnail streams still failed under fast-scroll production load and were reverted.

The root issue is architectural: the API and service worker are in the hot byte path for high-cardinality media reads. Every browser scheduling, cancellation, backpressure, service-worker clone, Express close, S3 SDK stream, and limiter interaction must be correct for the system to keep loading photos. That coupling is too brittle for timeline scrolling.

## Goals

- Remove the Gallery API process from the S3 media byte path for normal browser-readable S3 deployments.
- Remove the service worker from media response bodies.
- Preserve Gallery authorization semantics before a user can read media.
- Preserve disk-backed and mixed disk/S3 deployments.
- Preserve S3 proxy mode as an explicit fallback for S3 endpoints that browsers cannot reach.
- Keep originals, previews, thumbnails, videos, person thumbnails, profile images, shared-link media, and download filenames working.
- Add regression coverage that proves fast-scroll media loading does not wedge the API process.

## Non-Goals

- Rewriting upload, thumbnail generation, video transcoding, storage migration, or S3 object layout.
- Making S3 objects public.
- Building a CDN integration in this change.
- Removing S3 proxy mode from the codebase.
- Fixing unrelated bulk-add or face-recognition queue behavior.

## Decision

Use direct S3 delivery for browser-readable S3 deployments:

```text
browser image/video request
  -> Gallery API authorization
  -> short-lived 302 redirect to a presigned S3 URL
  -> browser downloads bytes directly from S3
```

The Gallery server remains the authorization and URL-signing boundary. The browser never receives raw bucket credentials and S3 objects remain private. The server no longer owns the media stream lifetime after it has authorized and signed a request.

This uses the existing `redirect` serve strategy in `S3StorageBackend`, but it must be paired with three supporting changes:

1. Service worker media bypass: do not intercept `/api/assets/:id/thumbnail`, `/api/assets/:id/original`, or video playback media.
2. Redirect response semantics: do not cache a 302 longer than its presigned URL can remain valid, and include filename/content-type response overrides in signed URLs.
3. S3 CORS and frontend image attributes: allow canvas workflows to keep working when image bytes come from S3 instead of same-origin API responses.

## Approaches Considered

### Recommended: Presigned Redirects Plus Service-Worker Bypass

The API authorizes the request and returns a short-lived presigned URL. The service worker ignores media routes so the browser owns the final media request directly.

Pros:

- Removes Node streams, Express backpressure, S3 SDK sockets, and service-worker response clones from normal media delivery.
- Uses an existing backend serve mode.
- Keeps private buckets through presigned URLs.
- Scales with S3 and browser connection handling instead of API process sockets.
- Smallest durable architecture change.

Cons:

- Requires S3 CORS for canvas workflows.
- Exposes temporary provider URLs to the browser.
- Requires care around redirect cache headers and presigned expiry.

### Alternative: Batch Signed Media URLs In API DTOs

Asset list endpoints return signed thumbnail/preview URLs directly, avoiding one API redirect per image.

Pros:

- Reduces API round trips for dense grids.
- Makes direct media delivery explicit in DTOs.

Cons:

- Larger API and web contract change.
- Signed URLs may expire while asset DTOs remain cached in client state.
- More places need refresh logic.
- Does not help disk-backed assets and complicates mixed-mode responses.

This can be a later optimization after redirect delivery is stable.

### Alternative: Dedicated Media Gateway Or CDN

Gallery authorizes media through a separate gateway or CDN that can validate signed cookies/URLs and fetch private S3 objects.

Pros:

- Keeps a stable first-party media hostname.
- Can add edge caching and range handling.
- Keeps the application API out of the stream path.

Cons:

- Larger operational footprint.
- More secrets and routing configuration.
- Not needed to fix the immediate failure on the production instance.

This is a future infrastructure option if presigned provider URLs become unacceptable.

## Backend Design

### Serve Mode Policy

`IMMICH_S3_SERVE_MODE=redirect` should be the recommended mode for S3 endpoints reachable by browsers. `proxy` remains supported only for private-network S3 endpoints or deployments that intentionally cannot expose S3 URLs to clients.

Documentation should be updated to make the tradeoff explicit:

- `redirect`: normal mode, best for performance and reliability.
- `proxy`: compatibility fallback, higher API resource cost, vulnerable to browser backpressure and cancellation behavior under large media bursts.

Production GitOps config should switch from `proxy` to `redirect` only after the code changes below are available.

### Proxy Fallback Behavior

Proxy mode remains a supported serve strategy. The design does not remove `ImmichStreamResponse`, `S3StorageBackend.get()`, or streaming through `sendFile()`. A deployment with browser-unreachable S3 can continue using:

```text
browser media request
  -> Gallery API authorization
  -> S3 GetObject stream in the Node process
  -> Express response stream
  -> browser media consumer
```

The service worker media bypass applies to proxy mode too. Even when the API must stream bytes, the browser should receive that stream directly instead of through a service-worker cloned `Response` body. That keeps proxy compatibility while removing one known source of body-retention and cancellation coupling.

Proxy mode should not receive another default idle-timeout, buffering, or abort-propagation stack as part of this work. Those were already tried and reverted after production fast-scroll stalls persisted. The first implementation should only verify that existing proxy behavior still works without service-worker interception. Deeper proxy hardening should be a separate design if someone needs private-network S3 at large timeline scale.

### Presigned URL Response Overrides

`S3StorageBackend.getServeStrategy()` should include response overrides when generating a presigned URL:

- `ResponseContentType`: existing behavior.
- `ResponseContentDisposition`: include inline or attachment filename when the service provides one.
- Optional `ResponseCacheControl`: only if we intentionally want the S3 response to carry a cache policy.

The backend interface currently accepts only `(key, contentType)`. It should be extended with a serve options object:

```typescript
type ServeOptions = {
  contentType: string;
  fileName?: string;
  disposition?: 'inline' | 'attachment';
  cacheControl: CacheControl;
};

getServeStrategy(key: string, options: ServeOptions): Promise<ServeStrategy>;
```

Disk and proxy responses keep using the existing `ImmichMediaResponse` shape. Redirect responses gain enough metadata to control HTTP 302 cache headers safely.

### Redirect Cache Headers

The 302 redirect response must not be cached longer than the signed URL expiry. The safest default is:

```text
Cache-Control: private, no-cache, no-transform
```

That lets the browser cache final S3 object bytes according to the S3 response, but forces revalidation of the API authorization redirect instead of reusing an expired presigned URL.

If we want cacheable redirects later, the max-age must be derived from `IMMICH_S3_PRESIGNED_URL_EXPIRY` with a safety margin, not from the normal 24-hour media cache header.

### Video And Range Requests

S3 must handle range requests directly for video playback. Redirect mode should preserve browser range behavior because the browser follows the redirect and sends `Range` to S3.

The API should not try to proxy or synthesize range responses for S3 redirect mode. The presigned URL used for browser media playback should be generated for `GET`; metadata probes that need content type should use a small GET range request instead of following `HEAD` to a GET-signed S3 URL.

### Shared Links And API Keys

Shared-link and API-key authorization remains on the API route. The API validates the current request, then signs a URL. The signed S3 URL does not encode Gallery auth state; it is valid until expiry.

Recommended expiry remains short, such as the existing default 3600 seconds. If tighter shared-link revocation is needed later, lower the expiry for shared-link requests through per-request serve options.

## Service Worker Design

The service worker should stop intercepting media routes. The current media request deduplication and cancelation layer introduces body ownership that is unsafe for streaming media.

Remove or narrow the `ASSET_REQUEST_REGEX` intercept so these routes are browser-native:

- `/api/assets/:id/thumbnail`
- `/api/assets/:id/original`
- `/api/assets/:id/video/playback`

Person and profile thumbnail routes are not currently intercepted, but they also use `sendFile()` and S3 backend resolution. They will benefit from backend redirect mode without service-worker changes.

The frontend can keep `cancelImageUrl()` calls as harmless no-ops for media URLs no longer owned by the service worker. A later cleanup can remove the media cancel protocol if no other route uses it.

## S3 CORS Design

Direct S3 image display through `<img>` can work without CORS, but canvas reads require CORS. Gallery has canvas workflows:

- Face crop helpers.
- Face editor thumbnail extraction.
- Copy image to clipboard.
- Edit/crop/mirror/rotate preview paths.

The S3 bucket needs CORS allowing Gallery origins to read media objects:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://gallery.example.com", "http://localhost:3000", "http://localhost:2283"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["Accept-Ranges", "Content-Length", "Content-Range", "Content-Type", "ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

The exact origin list should be environment-specific. Production should not use `*` if credentials are ever introduced. Presigned URLs do not need browser credentials, so images should use anonymous CORS.

## Frontend Design

### Image Components

The shared image primitives should support CORS-safe rendering:

- Add `crossorigin="anonymous"` to media images loaded through the shared `Image` component.
- Add `crossOrigin = 'anonymous'` before assigning `src` in explicit `new Image()` paths that may draw to canvas.
- Ensure `loadImage()` sets `crossOrigin` before `src` when it creates an off-DOM image.

This must be done before switching production to redirect mode, otherwise direct S3 images can display but canvas operations can fail with tainted-canvas errors.

### Download Links

Single-asset download currently clicks an API media URL. In redirect mode that will follow to S3. To preserve filenames reliably:

- Server-signed URLs should include `ResponseContentDisposition=attachment; filename*=UTF-8''...` for original downloads.
- Inline display routes should keep `inline`.

The client should not rely on the `<a download>` attribute for cross-origin S3 URLs.

### Cast And Content-Type Probe

Google Cast currently probes the media URL to get content type, then sends the authenticated URL to the cast device. In redirect mode, do not probe with `HEAD`: S3 presigned URLs are method-specific, so a `HEAD` request that follows a redirect to a GET-signed S3 URL can fail signature validation.

- The browser should probe with `GET` plus `Range: bytes=0-0`, which follows the normal GET-signed redirect path and returns headers with a minimal body.
- The cast device should still receive the authenticated Gallery API media URL with `sessionKey`.
- The cast device must be able to reach both Gallery and the S3 endpoint, and the generated S3 signature must not expire before playback starts.

This path should be tested manually on a redirect-mode S3 instance. If cast devices do not preserve query parameters, do not follow Gallery's 302, or cannot reach OVH S3, Cast may need a separate short-lived direct media URL endpoint.

## Data Flow

### Thumbnail Or Preview Display

1. Browser requests `/api/assets/:id/thumbnail?size=thumbnail&c=...`.
2. Gallery authenticates `AssetView`.
3. Gallery resolves the asset file path and backend.
4. Disk backend returns `file` and Express sends the local file.
5. S3 redirect backend returns `redirect` with a presigned S3 URL.
6. Gallery returns a 302 with safe redirect cache headers.
7. Browser follows to S3 and downloads bytes directly.

### Original Download

1. Browser requests `/api/assets/:id/original`.
2. Gallery authenticates `AssetDownload`.
3. Gallery signs S3 URL with content type and attachment filename response overrides.
4. Browser follows redirect and downloads from S3.

### Video Playback

1. Browser requests `/api/assets/:id/video/playback`.
2. Gallery authenticates `AssetView`.
3. Gallery signs a video object URL.
4. Browser follows redirect and sends normal range requests to S3.

## Testing Strategy

### Unit Tests

Backend:

- `S3StorageBackend` includes content type and content disposition overrides in presigned `GetObjectCommand`.
- Redirect responses use `private, no-cache, no-transform` or another expiry-safe policy instead of the normal 24-hour media cache header.
- Disk backend behavior is unchanged.
- Proxy backend behavior is unchanged for deployments that still choose `proxy`.
- `sendFile()` handles redirect metadata without applying stream/file cache behavior blindly.

Service worker:

- `GET /api/assets/:id/thumbnail` is not intercepted.
- `GET /api/assets/:id/original` is not intercepted.
- `GET /api/assets/:id/video/playback` is not intercepted.
- Non-media service-worker behavior remains unchanged.

Frontend:

- Shared `Image` renders `crossorigin="anonymous"` for media images.
- `loadImage()` and explicit canvas helper image loads set `crossOrigin` before `src`.
- Download URL generation still points at the API authorization route, not directly at S3.

### Integration Tests

MinIO or S3-compatible integration:

- Redirect-mode thumbnail request returns 302 and the redirected URL returns valid bytes.
- Original download redirect includes a filename override.
- Video playback redirect supports `Range` against the final S3 URL.
- CORS preflight or direct CORS checks confirm image GET/HEAD is allowed from a Gallery origin.

### Browser Regression

Add a Playwright scenario with service worker enabled:

1. Seed enough S3-backed assets to create several hundred timeline thumbnails.
2. Open `/photos`.
3. Fast-scroll through multiple viewport heights.
4. Assert visible thumbnails eventually transition out of blurred preview state.
5. Assert `/api/users/me` and `/api/server/ping` still respond during/after the scroll.
6. Assert API media requests do not pile up as long-running proxied streams.

This test should run against a redirect-mode S3-compatible test setup. If CI cannot run MinIO with Playwright, keep the full version as a manual RC smoke script and add lower-level automated coverage for the service-worker and redirect pieces.

## Rollout Plan

1. Land code changes with `proxy` still supported and existing default `redirect` unchanged.
2. Configure CORS on the production OVH bucket.
3. Deploy an RC to the production host while still in proxy mode to verify no regressions in disk/proxy behavior.
4. Change production GitOps `IMMICH_S3_SERVE_MODE` from `proxy` to `redirect`.
5. Hard refresh or unregister old service workers on the production host.
6. Fast-scroll `/photos`, people pages, shared spaces, asset viewer, video playback, downloads, face editor, and copy-to-clipboard.
7. Watch API pod sockets, Traefik 499/5xx rates, and app logs during the smoke.
8. If stable, update S3 documentation to recommend redirect mode for browser-reachable S3.

## Operational Notes

- Existing browser service workers may continue running old code until updated. The rollout should include a hard refresh or service-worker version bump verification.
- The production bucket currently has no CORS configuration. Redirect-mode canvas testing should not start until CORS is applied.
- Presigned URLs may appear in browser devtools and logs. They are temporary credentials and should be treated as sensitive while valid.
- Proxy mode should not be removed. It remains useful for private MinIO-style deployments, but it should not be used as the normal mode for large browser media grids.

## Success Criteria

- Fast-scrolling `/photos` no longer leaves the instance in a global blurred-media state.
- Media delivery no longer depends on long-lived S3 streams inside `gallery-server`.
- API health and auth endpoints stay responsive while hundreds of thumbnails load.
- Browser image cancellation no longer needs to propagate through service worker, API response, and S3 stream state.
- Canvas workflows still work against S3-backed images.
- Single downloads keep correct filenames.
- Video playback and range requests work through direct S3 delivery.

## Risks

- Some S3-compatible providers may have incomplete CORS or response override behavior. MinIO and OVH should be tested explicitly.
- Cross-origin redirects can expose provider hostnames in the browser, which should be documented.
- Cast devices may have different network reachability than the browser. This needs manual verification.
- Old service workers can mask the fix during RC testing if they keep intercepting media.

## First Implementation Decisions

- Shared-link requests should use the same presigned expiry as normal authenticated requests in the first implementation. Shorter shared-link expiry can be added later if revocation latency becomes a real problem.
- Redirect responses should use `private, no-cache, no-transform` in the first implementation. Cacheable 302 responses can be reconsidered later after the direct media path is stable.
- `crossorigin="anonymous"` should be applied in the shared `Image` component and off-DOM image loaders. Same-origin images continue to load, and S3 media becomes canvas-safe when bucket CORS is configured.
