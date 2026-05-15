# Open-in-App Prompt — Design

**Status:** Design approved 2026-04-16. Awaiting implementation plan.
**Branch:** `feat/open-in-app-prompt`

## Problem

When a user opens a Gallery web link on their mobile device (e.g. a friend shares
`https://<your-gallery>/photos/<uuid>` in a chat), the user lands in mobile
Safari/Chrome. They have the Gallery app installed but the web isn't telling them
that opening it in the app would be a better experience.

## Goals (v1)

- On mobile cold-entry to a deep-linkable Gallery route, render a top sticky
  banner suggesting they open the link in the app.
- Two CTAs: a primary "Open" anchor that launches the `noodle-gallery://`
  deep link, and a smaller "Don't have the app?" link routing to the
  install path.
- Dismissible (× button) — dismissal persists 30 days in `localStorage`.
- Zero server-side changes. Two small mobile-side changes:
  1. New `space` intent in `deep_link.service.dart`.
  2. Branding script registers `immich://` alongside `noodle-gallery://`
     (additive, not replacing) so legacy `immich://` Gallery links still
     work after migration from Immich.

## Non-goals (v1)

- Cross-server routing. If the link points to server X but the user's app is
  logged into server Y, the deep link will open against whichever account is
  active. Documented as a known limitation; revisit when multi-account is
  designed.
- Heuristic install detection. We don't try to detect whether the app is
  installed before showing CTAs — the user-facing flow is honest about the two
  states ("Open" vs. "Don't have the app?").
- iOS Safari Smart App Banner (`<meta name="apple-itunes-app">`). Skipped to
  keep one consistent banner across iOS and Android.
- `/share/:key`, `/s/:key`, `/spaces/<id>/people/<id>`, `/map`, `/places`.
  Deferred for reasons documented under Eligibility.
- Server-rendered banner (no FOUC optimisation).
- Admin-side toggle. Self-hosters can hide via custom CSS if needed.
- User-settings opt-out toggle. 30-day dismissal is enough; revisit if users
  complain.

## Architecture

A new Svelte 5 component `OpenInAppBanner.svelte` mounted inside
`+layout.svelte`'s `<TooltipProvider>`, above `{@render children?.()}`. On
mount it sets a `coldEntry` flag; an `$effect` evaluates eligibility once
`$user` resolves; if eligible, it renders a `position: fixed` top sticky bar
with a sibling spacer that pushes content below by the banner height.
`afterNavigate` hides the banner on any internal nav (skipping the first-fire
`type: 'enter'`).

### Files touched

```
web/src/lib/components/shared-components/open-in-app-banner.svelte    [new]
web/src/lib/components/shared-components/open-in-app-banner.spec.ts   [new]
web/src/lib/utils/open-in-app.ts                                       [new]
web/src/lib/utils/open-in-app.spec.ts                                  [new]
web/src/lib/constants.ts                                               [edit]
web/src/routes/+layout.svelte                                          [edit]
web/src/routes/(user)/install/+page.svelte                             [new]
i18n/src/en.json                                                       [edit]
branding/i18n/overrides-en.json                                        [edit]
mobile/lib/services/deep_link.service.dart                             [edit]
e2e/web/specs/open-in-app-banner.e2e.ts                                [new]
branding/scripts/verify-branding.sh                                    [edit]
```

## Eligibility

`isEligible()` is a pure function in `open-in-app.ts`. Returns
`{ eligible: false }` or
`{ eligible: true; deepLink: string; platform: 'ios' | 'android' }`.

ALL gates must pass:

1. **Cold entry.** Flag set by the banner component on mount; cleared on the
   first `afterNavigate({ type })` where `type !== 'enter'`. Internal SPA
   navigation does NOT trigger this gate. The first-fire of `afterNavigate`
   on initial load is `type: 'enter'` and must be ignored — without this,
   the banner would hide itself immediately after mounting.
2. **Mobile platform.** Detection:
   - `/iPhone|iPod|iPad/i.test(ua)` → `'ios'`, OR
   - `navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua)` → `'ios'`
     (covers modern iPadOS Safari, which defaults to a Mac UA), OR
   - `/Android/i.test(ua)` → `'android'`.
   - Else ineligible.
3. **Authenticated.** `$user` is truthy. Share routes are out of scope for
   v1, so we never need to handle the unauthenticated case.
4. **Not dismissed.** `localStorage['gallery.openInApp.dismissedUntil']` is
   absent OR `Date.parse(value) <= now`. Malformed values are treated as
   not-dismissed (graceful).
5. **Route matches and extracts a valid identifier.**

UUID regex matches the existing pattern in
`mobile/lib/services/deep_link.service.dart`:
`[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}`.

### Route → deep-link mapping

| Web route                           | Intent      | Deep link                               |
| ----------------------------------- | ----------- | --------------------------------------- |
| `/photos/<uuid>`                    | asset       | `noodle-gallery://asset?id=<uuid>`      |
| `/albums/<uuid>`                    | album       | `noodle-gallery://album?id=<uuid>`      |
| `/albums/<uuid>/<assetUuid>`        | asset       | `noodle-gallery://asset?id=<assetUuid>` |
| `/people/<uuid>`                    | people      | `noodle-gallery://people?id=<uuid>`     |
| `/memory/<uuid>`                    | memory      | `noodle-gallery://memory?id=<uuid>`     |
| `/memory`                           | memory      | `noodle-gallery://memory`               |
| `/spaces/<uuid>`                    | space (new) | `noodle-gallery://space?id=<uuid>`      |
| `/spaces/<uuid>/photos/<assetUuid>` | asset       | `noodle-gallery://asset?id=<assetUuid>` |

### Excluded from v1

- `/share/:key`, `/s/:key` — public/unauthenticated shares; the mobile app's
  deep-link service requires login. Add when share-link viewing lands in the
  app.
- `/spaces/<id>/people/<id>` — space-person IDs are a different ID space
  than global persons (see `feedback_space_people_vs_global`); can't safely
  map without app-side support.
- `/map`, `/places` — no clear corresponding "open here" view in the app.
- Root `/photos`, root `/albums`, root `/spaces` — no specific entity to
  open.
- All admin routes, `/onboarding`, `/auth/*`, `/install`.

### SSR safety

`localStorage`, `navigator`, `document` reads are guarded by
`import { browser } from '$app/environment'`. SSR returns
`{ eligible: false }` unconditionally; client re-evaluates after hydration.

## Mobile-app changes

### 1. New `space` intent

`mobile/lib/services/deep_link.service.dart`, in the `handleScheme` switch:

```dart
"space" => await _buildSpaceDeepLink(queryParams['id'] ?? ''),
```

Plus a `_buildSpaceDeepLink(String spaceId)` method that fetches the space
via the existing Riverpod space provider and returns the auto_route used by
the bottom-nav Spaces tab to open a single space (exact route name verified
during implementation).

### 2. Register both `immich://` and `noodle-gallery://` URI schemes

The branded Gallery build currently REPLACES `immich` with the
configured `mobile.deep_link_scheme` (`noodle-gallery`) in
`AndroidManifest.xml` and `Info.plist` — see existing lines in
`branding/scripts/apply-branding.sh`. We change those rules to be
**additive** so the branded build registers BOTH schemes:

```bash
# Android: insert a second <data> entry alongside the existing one
sed -i 's|<data android:scheme="immich"/>|<data android:scheme="immich"/>\n<data android:scheme="noodle-gallery"/>|' "$manifest"

# iOS: insert a second <string> in CFBundleURLSchemes
sed -i 's|<string>immich</string>|<string>immich</string>\n<string>noodle-gallery</string>|' "$info_plist"
```

Why both:

- `noodle-gallery://` is the brand-primary scheme. The web banner emits
  this; matches Gallery's identity; avoids the chooser dialog when the
  upstream Immich app is also installed.
- `immich://` is kept for migration compatibility. Users coming from
  Immich may have hand-crafted `immich://` shortcuts/bookmarks/links;
  registering the legacy scheme means those continue to work after they
  uninstall the Immich app.

`deep_link.service.dart` is scheme-agnostic — it parses
`link.uri.host`/`queryParameters` regardless of which scheme triggered
the launch. No service-side change is required to handle dual-scheme.

## UI

Top sticky bar, mobile only.

### Layout

Two-row layout below 480px viewport width; single-row above:

```
┌──────────────────────────────────────────────────┐
│  [icon]  Open in Noodle Gallery          [Open]  │  row 1: 56px
│          Better in the app              [×]      │  row 2: 32px (subtitle + dismiss right-aligned)
└──────────────────────────────────────────────────┘
                     ↓
              Don't have the app?  ← tiny secondary link, below row 2
```

### Specifics

- **Banner height**: 88px on narrow screens (two rows), 56px on ≥480px.
- **Spacer**: a sibling `<div>` adds matching `padding-top` to the layout's
  children container so content is not hidden under the banner.
- **App icon**: 48×48 pulled from `branding/assets/`, 12px border-radius
  (squircle hint), subtle 1px ring `ring-light/10 dark:ring-dark/10`, soft
  drop-shadow `shadow-sm`. Recognition is the point — same icon as the
  user's home screen.
- **Title**: `font-semibold text-base leading-tight` — "Open in Immich"
  in source, "Open in Noodle Gallery" via branding override.
- **Subtitle (second line, narrow viewports only)**: `text-xs text-subtle`,
  ellipsizes single line.
- **Primary CTA**: `<a href="immich://...">` (in source — branding rewrites
  to `noodle-gallery://`) styled as `@immich/ui` Button filled, `size="sm"`,
  label "Open". Anchor (not JS `window.location.href`) so iOS Safari
  handles failed launches more gracefully. Hit area ≥44×44.
- **Secondary CTA**: NOT a sibling button — a small text link
  ("Don't have the app?") routing to `IOS_APP_STORE_URL` on iOS or
  `ANDROID_INSTALL_URL` on Android. Reduces CTA competition; primary
  action wins.
- **Dismiss ×**: `@immich/ui` IconButton, 36×36 visual, 44×44 hit area,
  top-right, `text-subtle` color.
- **Background**: `bg-light dark:bg-dark` with 1px bottom border
  `border-light-100 dark:border-dark-100` and `shadow-sm` for lift. No
  gradient.
- **Z-index**: pinned (e.g. `z-banner: 40`) — above the route nav (~30),
  below modals (~50). Exact value confirmed by auditing the existing
  z-index ladder during implementation.

### Motion

- Mount: `translate-y-[-100%] → translate-y-0`, 280ms
  `cubic-bezier(0.32, 0.72, 0, 1)` (iOS spring-ish). First appearance only.
- Dismiss: same curve reversed, 220ms. Then unmount.
- No hover effects (mobile only).
- No bounce, shimmer, or icon pulse — restraint.
- Respects `prefers-reduced-motion` — instant show/hide.

### Accessibility

- `role="region" aria-label="Mobile app suggestion"` on the wrapper
  (`role="banner"` is reserved for the page-level landmark).
- All hit areas ≥44×44.
- Dismiss focusable; Escape-keyable when banner has focus.
- Subtitle marked `aria-hidden="true"` if visually duplicated by the title
  context (decision deferred to implementation).

### Copy (source — `i18n/src/en.json`)

| Key                           | Value                 |
| ----------------------------- | --------------------- |
| `open_in_app_banner_title`    | `Open in Immich`      |
| `open_in_app_banner_subtitle` | `Better in the app`   |
| `open_in_app_banner_open`     | `Open`                |
| `open_in_app_banner_get_app`  | `Don't have the app?` |
| `open_in_app_banner_dismiss`  | `Dismiss banner`      |

### Branding overrides (`branding/i18n/overrides-en.json`)

Same keys with "Noodle Gallery" wording.

### Web deep-link scheme rewrite

The web source emits `immich://` (matching the rest of the codebase's
upstream-naming convention). One additional rule in `apply-branding.sh`
rewrites the scheme to `noodle-gallery://` for branded builds:

```bash
sed -i "s|immich://|${DEEP_LINK_SCHEME}://|g" "$REPO_ROOT/web/src/lib/utils/open-in-app.ts"
```

After branding the web emits `noodle-gallery://...`, which the Gallery app
registers as primary. The mobile-side dual registration (`immich://` AND
`noodle-gallery://`) ensures legacy `immich://` links from migrated users
keep working too.

## Get-the-app destinations

```ts
// web/src/lib/constants.ts
export const IOS_APP_STORE_URL = 'https://apps.apple.com/app/id6761776289';
export const ANDROID_INSTALL_URL = '/install';
```

`/install` is a thin SvelteKit route wrapping the existing onboarding
component:

```svelte
<!-- web/src/routes/(user)/install/+page.svelte -->
<script>
  import OnboardingMobileApp from '$lib/components/onboarding-page/onboarding-mobile-app.svelte';
</script>
<OnboardingMobileApp />
```

When the Android Play Store listing goes live, swap `ANDROID_INSTALL_URL`
to the Play URL — single-line change.

## Dismissal

Tapping × writes
`localStorage['gallery.openInApp.dismissedUntil'] = (now + 30d).toISOString()`
and unmounts the banner. The next cold-entry to a deep-link route within
30 days re-evaluates the gate and stays hidden. After 30 days, the next
cold-entry shows the banner again — by then the user may have installed
the app, or genuinely changed their mind.

## Testing

### Unit (`open-in-app.spec.ts`)

- `isEligible` truth table: each gate's pass / fail.
- Each route table row → expected deep link (positive).
- Invalid UUIDs → `eligible: false` (negative).
- `/albums/<a>/<b>` → `<scheme>://asset?id=<b>` (sub-album mapping).
- iPhone, iPad-old, iPad-as-Mac, Pixel 5, desktop UAs → expected platform
  or false.
- Dismissal expiry: past, future, null, malformed.

### Component (`open-in-app-banner.spec.ts`)

- Renders when eligible; renders nothing when not.
- Asserts `<a>` element has `href="immich://..."` in source (or
  `noodle-gallery://...` after branding) — not a JS click handler.
- Click dismiss → `localStorage[key]` set to ~30 days out (5s tolerance).
- Mock `@immich/ui` IconButton → Button per `feedback_iconbutton_test_mock.md`.
- `prefers-reduced-motion` mocked → no slide-in classes applied.
- Auth-resolves-late: mount with `$user = null`, set `$user = {…}` →
  banner appears (validates `$effect` re-evaluation).
- `afterNavigate` first-fire skip: trigger `{ type: 'enter' }` → still
  visible; trigger `{ type: 'link' }` → hidden.

### E2E (`e2e/web/specs/open-in-app-banner.e2e.ts`)

- iPhone 13 emulation: cold-nav to `/photos/<seeded-id>` → banner visible →
  "Open" anchor href contains `noodle-gallery://asset?id=<uuid>`.
- Pixel 5 emulation: same; "Don't have the app?" routes to `/install`.
- iPhone emulation: same; "Don't have the app?" routes to App Store URL.
- Desktop (no emulation): banner not present.
- Cold-nav → click dismiss → reload → banner not present.
- Cold-nav to `/photos` → click thumbnail → SPA nav to `/photos/<id>` →
  banner does NOT appear (intentional cold-entry-only UX).
- Cold-nav to `/spaces/<seeded-id>` → banner with
  `noodle-gallery://space?id=<uuid>` (validates the new space intent's web side).

### Mobile (Flutter)

- `handleScheme` parses `noodle-gallery://space?id=<uuid>` → returns the right
  `PageRouteInfo` for the space view (verify against the actual auto_route
  route name during implementation).

### Branding verification

Add to `branding/scripts/verify-branding.sh` (or as a CI step) two
assertions that fire after `apply-branding.sh` has run:

1. `web/src/lib/utils/open-in-app.ts` no longer contains `immich://` —
   confirms the scheme rewrite ran.
2. `web/src/lib/utils/open-in-app.ts` contains `noodle-gallery://` — the
   replacement landed.
3. `mobile/android/app/src/main/AndroidManifest.xml` and
   `mobile/ios/Runner/Info.plist` BOTH contain `immich` AND
   `noodle-gallery` scheme entries — confirms the additive (not
   replacing) rewrite ran for both platforms.

## Edge cases

| Case                                             | Behaviour                                                                                                                                       |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| App installed → "Open" tap                       | Browser launches `noodle-gallery://`, Gallery app opens. ✓                                                                                      |
| No app → "Open" tap                              | Browser may show "no app handles URL" (iOS) or fail silently (Android). User can tap "Don't have the app?" to install. Acceptable v1 behaviour. |
| Page refresh while dismissed                     | Eligibility re-evaluated; banner stays suppressed within 30 days.                                                                               |
| In-app navigation to deep-link route             | `+layout.svelte` doesn't remount → banner doesn't appear. Intentional.                                                                          |
| iPad identifying as Mac (modern iPadOS default)  | `navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua)` heuristic catches it.                                                                   |
| `localStorage` disabled (incognito strict)       | Dismissal can't persist; banner re-shows every cold load. Documented limitation; rare.                                                          |
| Cross-server (link points to server X, app on Y) | Out of scope v1. App opens against whichever account is active; may show wrong asset or 404. Documented limitation.                             |

## Open follow-ups (post-v1)

- Cross-server routing (encode source server URL in deep link, app validates
  against current account).
- Share-link support (`/share/:key`) — requires app-side handling for
  unauthenticated viewing.
- Space-person deep linking — requires unifying the space-person ID space
  with the global person ID space.
- Apple Smart App Banner (`<meta name="apple-itunes-app">`) as a
  complement on iOS — skipped in v1 to avoid stacked banners.
- `/install` page → swap `ANDROID_INSTALL_URL` to Play Store when listing
  goes live.
- User-settings permanent opt-out toggle if 30-day dismissal proves
  insufficient.
