# Collapsible SpaceHero Design

## Problem

The SpaceHero is 450px tall and sits at the top of the space timeline. Combined with the
FilterPanel sidebar (256px wide) and ActiveFiltersBar, too much screen is consumed by chrome
before users see their photos — especially when actively filtering.

## Solution

Add a manual collapse toggle to SpaceHero that shrinks it from 450px to 56px. Auto-collapse
when filters become active.

## Behavior

### Manual Toggle

Chevron button on the hero toggles collapsed/expanded. Always available.

### Auto-Collapse on Filter Activation

When active filter count transitions from 0 to >0, the hero auto-collapses. Covers person,
location, camera, tag, rating, and media type filters.

Known gap: temporal picker (year/month) does not trigger auto-collapse because
`getActiveFilterCount` does not count those. Can be addressed separately.

### Stays Collapsed During Filter Work

Changing or clearing filters never auto-expands the hero. User re-expands manually.

### Repositioning Override

When repositioning the cover image, the hero always shows expanded regardless of collapsed
state. When repositioning ends, it returns to whatever collapsed state it was in.

### State Management

State lives in the space page (`+page.svelte`), not inside SpaceHero. No localStorage
persistence — session-only for v1.

```typescript
let heroCollapsed = $state(false);
let prevFilterCount = 0; // plain variable, not $state

$effect(() => {
  const count = getActiveFilterCount(filters);
  if (count > 0 && prevFilterCount === 0) {
    heroCollapsed = true;
  }
  prevFilterCount = count;
});
```

## Visual Design

### Expanded State (Current + Toggle Button)

Everything stays as-is. One addition: a collapse button at the end of the badges row
(bottom-left overlay area).

- Style: `rounded-full bg-white/20 backdrop-blur-sm p-1`
- Icon: `mdiChevronUp` (16px)
- Attributes: `aria-expanded="true"`, `aria-label="Collapse space header"`
- Hidden during repositioning mode

### Collapsed State (56px Compact Bar)

```
┌─────────────────────────────────────────────────────────────────┐
│ [cover image clipped + dark overlay, or gradient + dark overlay] │
│  Space Name       📷 123 photos  👥 5 members  Owner       [▼] │
└─────────────────────────────────────────────────────────────────┘
```

- Height: 56px, `rounded-xl` (same as expanded)
- **With cover**: same absolute-positioned `<img>` naturally clipped by container height,
  plus `bg-black/60` overlay for legibility
- **Without cover**: `gradientClass` gradient (`bg-gradient-to-br`) plus dark overlay
- Layout: `flex items-center px-4 gap-3 h-full`
  - Space name: `text-base font-semibold text-white drop-shadow-md truncate flex-1`
  - Stat badges: same icons, smaller pills (`text-xs py-0.5 px-2`), frosted glass.
    People count is plain text (not a link) in collapsed mode
  - Role badge: `text-xs`
  - Expand button: far right, `rounded-full bg-white/20 p-1.5 backdrop-blur-sm`,
    icon `mdiChevronDown`, `aria-expanded="false"`
- **Mobile (<500px)**: badges hidden (`hidden sm:inline-flex`), just name + expand button

### Transition

- Container: `transition: height 300ms ease` via inline style
- `overflow: hidden` already present on the container
- Content switches via `{#if collapsed}` conditional rendering (not dual-DOM crossfade)
- The cover `<img>` stays in place (absolute-positioned, object-cover) and is naturally
  clipped by the shrinking container

## Props Changes to SpaceHero

```typescript
interface Props {
  // ... all existing props unchanged
  collapsed?: boolean; // NEW — default false
  onToggleCollapse?: () => void; // NEW — callback
}
```

## Files Changed

1. `web/src/lib/components/spaces/space-hero.svelte` — Add collapsed/onToggleCollapse props,
   collapsed bar markup, toggle button in expanded view, height transition
2. `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte` —
   Add `heroCollapsed` state, auto-collapse `$effect`, pass new props to SpaceHero

## Out of Scope

- No localStorage persistence (session-only state)
- No scroll-based auto-collapse
- No new components created
- No changes to FilterPanel
- No changes to SpacePeopleStrip (stays visible below hero regardless)
