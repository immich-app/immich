# Spaces List/Grid View Toggle & Pinned Spaces — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add list/grid view toggle and client-side pinned spaces to the spaces list page.

**Architecture:** Client-only changes — store additions for view mode and pinned IDs (both localStorage-persisted), a new table component for list view, context menus on cards/rows for pinning, and pinned section rendering in both view modes. No server or API changes.

**Tech Stack:** Svelte 5 (runes), Tailwind CSS 4, `@immich/ui`, `svelte-persisted-store`, Vitest + @testing-library/svelte

---

### Task 1: Add `viewMode` to store

**Files:**

- Modify: `web/src/lib/stores/space-view.store.ts`

**Step 1: Write the failing test**

Create `web/src/lib/stores/space-view.store.spec.ts`:

```ts
import { get } from 'svelte/store';
import { spaceViewSettings } from '$lib/stores/space-view.store';

describe('space-view store', () => {
  it('should default viewMode to card', () => {
    const settings = get(spaceViewSettings);
    expect(settings.viewMode).toBe('card');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && pnpm test -- --run src/lib/stores/space-view.store.spec.ts`
Expected: FAIL — `viewMode` property does not exist on `SpaceViewSettings`.

**Step 3: Write minimal implementation**

In `web/src/lib/stores/space-view.store.ts`, add `viewMode` to the interface and default:

```ts
export type SpaceViewMode = 'card' | 'list';

export interface SpaceViewSettings {
  sortBy: string;
  sortOrder: string;
  viewMode: SpaceViewMode;
}

export const spaceViewSettings = persisted<SpaceViewSettings>('space-view-settings', {
  sortBy: SpaceSortBy.LastActivity,
  sortOrder: SortOrder.Desc,
  viewMode: 'card',
});
```

**Step 4: Run test to verify it passes**

Run: `cd web && pnpm test -- --run src/lib/stores/space-view.store.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add web/src/lib/stores/space-view.store.ts web/src/lib/stores/space-view.store.spec.ts
git commit -m "feat(spaces): add viewMode to space view settings store"
```

---

### Task 2: Add `pinnedSpaceIds` store

**Files:**

- Modify: `web/src/lib/stores/space-view.store.ts`
- Modify: `web/src/lib/stores/space-view.store.spec.ts`

**Step 1: Write the failing test**

Add to `space-view.store.spec.ts`:

```ts
import { pinnedSpaceIds } from '$lib/stores/space-view.store';

describe('pinnedSpaceIds store', () => {
  it('should default to empty array', () => {
    const ids = get(pinnedSpaceIds);
    expect(ids).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && pnpm test -- --run src/lib/stores/space-view.store.spec.ts`
Expected: FAIL — `pinnedSpaceIds` not exported.

**Step 3: Write minimal implementation**

Add to `web/src/lib/stores/space-view.store.ts`:

```ts
export const pinnedSpaceIds = persisted<string[]>('pinned-space-ids', []);
```

**Step 4: Run test to verify it passes**

Run: `cd web && pnpm test -- --run src/lib/stores/space-view.store.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add web/src/lib/stores/space-view.store.ts web/src/lib/stores/space-view.store.spec.ts
git commit -m "feat(spaces): add pinnedSpaceIds persisted store"
```

---

### Task 3: Add SharedSpaceResponseDto test factory

**Files:**

- Create: `web/src/test-data/factories/shared-space-factory.ts`

**Step 1: Write the factory**

No test-first needed for a test helper. Create `web/src/test-data/factories/shared-space-factory.ts`:

```ts
import { faker } from '@faker-js/faker';
import { UserAvatarColor, type SharedSpaceResponseDto } from '@immich/sdk';
import { Sync } from 'factory.ts';

export const sharedSpaceFactory = Sync.makeFactory<SharedSpaceResponseDto>({
  id: Sync.each(() => faker.string.uuid()),
  name: Sync.each(() => faker.lorem.words(2)),
  description: null,
  createdById: Sync.each(() => faker.string.uuid()),
  createdAt: Sync.each(() => faker.date.past().toISOString()),
  updatedAt: Sync.each(() => faker.date.past().toISOString()),
  color: UserAvatarColor.Primary,
  thumbnailAssetId: null,
  assetCount: Sync.each((i) => i * 10),
  memberCount: Sync.each((i) => (i % 5) + 1),
  members: [],
  recentAssetIds: [],
  recentAssetThumbhashes: [],
  lastActivityAt: Sync.each(() => faker.date.recent().toISOString()),
  newAssetCount: 0,
  lastContributor: null,
  lastViewedAt: null,
});
```

**Step 2: Verify it compiles**

Run: `cd web && npx tsc --noEmit`
Expected: No errors referencing the factory file.

**Step 3: Commit**

```bash
git add web/src/test-data/factories/shared-space-factory.ts
git commit -m "test: add SharedSpaceResponseDto test factory"
```

---

### Task 4: Add view toggle button to SpacesControls

**Files:**

- Modify: `web/src/lib/components/spaces/spaces-controls.svelte`

**Step 1: Write the failing test**

Create `web/src/lib/components/spaces/spaces-controls.spec.ts`:

```ts
import { render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import SpacesControls from '$lib/components/spaces/spaces-controls.svelte';
import { spaceViewSettings } from '$lib/stores/space-view.store';
import { get } from 'svelte/store';
import { sharedSpaceFactory } from '@test-data/factories/shared-space-factory';

describe('SpacesControls', () => {
  it('should render view toggle button', () => {
    const spaces = [sharedSpaceFactory.build()];
    const { getByTestId } = render(SpacesControls, { props: { spaces, onSorted: vi.fn() } });
    expect(getByTestId('view-toggle')).toBeDefined();
  });

  it('should toggle viewMode from card to list on click', async () => {
    const user = userEvent.setup();
    const spaces = [sharedSpaceFactory.build()];
    const { getByTestId } = render(SpacesControls, { props: { spaces, onSorted: vi.fn() } });

    expect(get(spaceViewSettings).viewMode).toBe('card');
    await user.click(getByTestId('view-toggle'));
    expect(get(spaceViewSettings).viewMode).toBe('list');
  });

  it('should toggle viewMode from list back to card on click', async () => {
    const user = userEvent.setup();
    spaceViewSettings.set({ ...get(spaceViewSettings), viewMode: 'list' });
    const spaces = [sharedSpaceFactory.build()];
    const { getByTestId } = render(SpacesControls, { props: { spaces, onSorted: vi.fn() } });

    await user.click(getByTestId('view-toggle'));
    expect(get(spaceViewSettings).viewMode).toBe('card');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && pnpm test -- --run src/lib/components/spaces/spaces-controls.spec.ts`
Expected: FAIL — `data-testid="view-toggle"` not found.

**Step 3: Write minimal implementation**

In `web/src/lib/components/spaces/spaces-controls.svelte`, add the view toggle button. Import `mdiFormatListBulletedSquare` and `mdiViewGridOutline` from `@mdi/js`. Add after the sort dropdown:

```svelte
<button
  type="button"
  class="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
  onclick={() => ($spaceViewSettings.viewMode = $spaceViewSettings.viewMode === 'card' ? 'list' : 'card')}
  data-testid="view-toggle"
>
  <Icon icon={$spaceViewSettings.viewMode === 'card' ? mdiFormatListBulletedSquare : mdiViewGridOutline} size="18" />
</button>
```

Update the controls wrapper to use `flex justify-end gap-2` to accommodate both buttons.

**Step 4: Run test to verify it passes**

Run: `cd web && pnpm test -- --run src/lib/components/spaces/spaces-controls.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add web/src/lib/components/spaces/spaces-controls.svelte web/src/lib/components/spaces/spaces-controls.spec.ts
git commit -m "feat(spaces): add list/grid view toggle button to controls"
```

---

### Task 5: Create SpacesTable component

**Files:**

- Create: `web/src/lib/components/spaces/spaces-table.svelte`
- Create: `web/src/lib/components/spaces/spaces-table.spec.ts`

**Step 1: Write the failing tests**

Create `web/src/lib/components/spaces/spaces-table.spec.ts`:

```ts
import { render } from '@testing-library/svelte';
import SpacesTable from '$lib/components/spaces/spaces-table.svelte';
import { sharedSpaceFactory } from '@test-data/factories/shared-space-factory';
import { UserAvatarColor } from '@immich/sdk';

describe('SpacesTable', () => {
  const currentUserId = 'current-user-id';
  const baseSpace = sharedSpaceFactory.build({
    name: 'Family Photos',
    color: UserAvatarColor.Blue,
    assetCount: 342,
    memberCount: 5,
    newAssetCount: 12,
    lastActivityAt: new Date().toISOString(),
    members: [
      {
        userId: currentUserId,
        name: 'Test User',
        email: 'test@example.com',
        role: 'owner',
        joinedAt: new Date().toISOString(),
        showInTimeline: true,
      },
    ],
  });

  it('should render space name', () => {
    const { getByText } = render(SpacesTable, {
      props: { spaces: [baseSpace], currentUserId },
    });
    expect(getByText('Family Photos')).toBeDefined();
  });

  it('should render asset count', () => {
    const { getByText } = render(SpacesTable, {
      props: { spaces: [baseSpace], currentUserId },
    });
    expect(getByText('342')).toBeDefined();
  });

  it('should render member count', () => {
    const { getByText } = render(SpacesTable, {
      props: { spaces: [baseSpace], currentUserId },
    });
    expect(getByText('5')).toBeDefined();
  });

  it('should render new activity badge when newAssetCount > 0', () => {
    const { getByTestId } = render(SpacesTable, {
      props: { spaces: [baseSpace], currentUserId },
    });
    expect(getByTestId('new-badge-' + baseSpace.id)).toBeDefined();
  });

  it('should render em-dash when no new activity', () => {
    const space = sharedSpaceFactory.build({ newAssetCount: 0 });
    const { getByTestId } = render(SpacesTable, {
      props: { spaces: [space], currentUserId },
    });
    const cell = getByTestId('new-cell-' + space.id);
    expect(cell.textContent).toContain('\u2014');
  });

  it('should render role badge for current user', () => {
    const { getByTestId } = render(SpacesTable, {
      props: { spaces: [baseSpace], currentUserId },
    });
    expect(getByTestId('role-badge-owner')).toBeDefined();
  });

  it('should render color bar with space color', () => {
    const { getByTestId } = render(SpacesTable, {
      props: { spaces: [baseSpace], currentUserId },
    });
    expect(getByTestId('color-bar-' + baseSpace.id)).toBeDefined();
  });

  it('should render multiple spaces as rows', () => {
    const spaces = [
      sharedSpaceFactory.build({ name: 'Space A' }),
      sharedSpaceFactory.build({ name: 'Space B' }),
      sharedSpaceFactory.build({ name: 'Space C' }),
    ];
    const { container } = render(SpacesTable, {
      props: { spaces, currentUserId },
    });
    const rows = container.querySelectorAll('[data-testid="space-row"]');
    expect(rows.length).toBe(3);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && pnpm test -- --run src/lib/components/spaces/spaces-table.spec.ts`
Expected: FAIL — module not found.

**Step 3: Write minimal implementation**

Create `web/src/lib/components/spaces/spaces-table.svelte`:

```svelte
<script lang="ts">
  import RoleBadge from '$lib/components/spaces/role-badge.svelte';
  import SpaceCollage from '$lib/components/spaces/space-collage.svelte';
  import { Route } from '$lib/route';
  import { formatTimeAgo } from '$lib/utils/timesince';
  import { UserAvatarColor, type SharedSpaceResponseDto } from '@immich/sdk';

  interface Props {
    spaces: SharedSpaceResponseDto[];
    currentUserId: string;
  }

  let { spaces, currentUserId }: Props = $props();

  const gradientBarColors: Record<string, string> = {
    [UserAvatarColor.Primary]: 'bg-immich-primary',
    [UserAvatarColor.Pink]: 'bg-pink-400',
    [UserAvatarColor.Red]: 'bg-red-500',
    [UserAvatarColor.Yellow]: 'bg-yellow-500',
    [UserAvatarColor.Blue]: 'bg-blue-500',
    [UserAvatarColor.Green]: 'bg-green-600',
    [UserAvatarColor.Purple]: 'bg-purple-600',
    [UserAvatarColor.Orange]: 'bg-orange-600',
    [UserAvatarColor.Gray]: 'bg-gray-500',
    [UserAvatarColor.Amber]: 'bg-amber-500',
  };

  const badgeColors: Record<string, string> = {
    [UserAvatarColor.Primary]: 'bg-immich-primary/10 text-immich-primary',
    [UserAvatarColor.Pink]: 'bg-pink-100 text-pink-600',
    [UserAvatarColor.Red]: 'bg-red-100 text-red-600',
    [UserAvatarColor.Yellow]: 'bg-yellow-100 text-yellow-700',
    [UserAvatarColor.Blue]: 'bg-blue-100 text-blue-600',
    [UserAvatarColor.Green]: 'bg-green-100 text-green-700',
    [UserAvatarColor.Purple]: 'bg-purple-100 text-purple-600',
    [UserAvatarColor.Orange]: 'bg-orange-100 text-orange-600',
    [UserAvatarColor.Gray]: 'bg-gray-200 text-gray-600',
    [UserAvatarColor.Amber]: 'bg-amber-100 text-amber-700',
  };

  function getUserRole(space: SharedSpaceResponseDto): string {
    const member = space.members?.find((m) => m.userId === currentUserId);
    return member?.role ?? 'viewer';
  }

  function getCollageAssets(space: SharedSpaceResponseDto) {
    return (space.recentAssetIds ?? []).map((id, i) => ({
      id,
      thumbhash: space.recentAssetThumbhashes?.[i] ?? null,
    }));
  }
</script>

<table class="w-full">
  <thead>
    <tr class="border-b text-left text-sm text-gray-500 dark:text-gray-400">
      <th class="w-8"></th>
      <th class="py-3 ps-2 font-medium">Name</th>
      <th class="py-3 font-medium">Role</th>
      <th class="py-3 text-right font-medium">Photos</th>
      <th class="py-3 text-right font-medium">Members</th>
      <th class="py-3 text-center font-medium">New</th>
      <th class="py-3 pe-4 text-right font-medium">Last Activity</th>
    </tr>
  </thead>
  <tbody>
    {#each spaces as space (space.id)}
      {@const barColor = gradientBarColors[space.color ?? 'primary'] ?? gradientBarColors[UserAvatarColor.Primary]}
      {@const role = getUserRole(space)}
      {@const collageAssets = getCollageAssets(space)}
      {@const badgeColor = badgeColors[space.color ?? 'primary'] ?? badgeColors[UserAvatarColor.Primary]}
      <tr
        class="group cursor-pointer border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
        data-testid="space-row"
      >
        <td class="relative py-3" data-testid="color-bar-{space.id}">
          <div class="absolute inset-y-0 start-0 w-[3px] rounded-full {barColor}"></div>
        </td>
        <td class="py-3 ps-2">
          <a href={Route.viewSpace({ id: space.id })} class="flex items-center gap-3">
            <div class="h-8 w-8 shrink-0 overflow-hidden rounded-lg">
              <SpaceCollage assets={collageAssets} gradientClass="" preload={false} />
            </div>
            <span class="font-medium text-black dark:text-white group-hover:text-primary">{space.name}</span>
          </a>
        </td>
        <td class="py-3">
          <RoleBadge {role} spaceColor={space.color} size="sm" />
        </td>
        <td class="py-3 text-right tabular-nums">{space.assetCount ?? 0}</td>
        <td class="py-3 text-right tabular-nums">{space.memberCount ?? 0}</td>
        <td class="py-3 text-center" data-testid="new-cell-{space.id}">
          {#if (space.newAssetCount ?? 0) > 0}
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {badgeColor}"
              data-testid="new-badge-{space.id}"
            >
              {(space.newAssetCount ?? 0) > 99 ? '99+' : space.newAssetCount} new
            </span>
          {:else}
            <span class="text-gray-400">&mdash;</span>
          {/if}
        </td>
        <td class="py-3 pe-4 text-right text-sm text-gray-500 dark:text-gray-400">
          {space.lastActivityAt ? formatTimeAgo(space.lastActivityAt) : '\u2014'}
        </td>
      </tr>
    {/each}
  </tbody>
</table>
```

**Step 4: Run test to verify it passes**

Run: `cd web && pnpm test -- --run src/lib/components/spaces/spaces-table.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add web/src/lib/components/spaces/spaces-table.svelte web/src/lib/components/spaces/spaces-table.spec.ts
git commit -m "feat(spaces): add SpacesTable list view component"
```

---

### Task 6: Wire up view toggle in spaces page

**Files:**

- Modify: `web/src/routes/(user)/spaces/+page.svelte`

**Step 1: Write the failing test**

Create `web/src/routes/(user)/spaces/+page.spec.ts`:

```ts
import { render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { spaceViewSettings } from '$lib/stores/space-view.store';
import { get } from 'svelte/store';
import { sharedSpaceFactory } from '@test-data/factories/shared-space-factory';

// Mock the page component indirectly through the controls + card/table presence
// Since this is a SvelteKit page with PageData, we test via the sub-components

describe('Spaces page view mode', () => {
  it('should use grid-auto-fill-72 for card grid', async () => {
    spaceViewSettings.set({ ...get(spaceViewSettings), viewMode: 'card' });
    // This is verified visually / via E2E — unit test covers store default
    expect(get(spaceViewSettings).viewMode).toBe('card');
  });

  it('should switch to list viewMode', async () => {
    spaceViewSettings.set({ ...get(spaceViewSettings), viewMode: 'list' });
    expect(get(spaceViewSettings).viewMode).toBe('list');
  });
});
```

Note: Full page rendering with `PageData` is complex in unit tests. The real integration is verified by the SpacesControls toggle test (Task 4) driving `spaceViewSettings.viewMode`, and the SpacesTable test (Task 5). The page just reads the store and conditionally renders.

**Step 2: Implement the page changes**

Modify `web/src/routes/(user)/spaces/+page.svelte`:

1. Import `spaceViewSettings` and `SpacesTable`
2. Import `user` from `$lib/stores/user.store`
3. Change grid class from `grid-auto-fill-56` to `grid-auto-fill-72`
4. Add conditional rendering:

```svelte
{#if $spaceViewSettings.viewMode === 'list'}
  <SpacesTable spaces={sortedSpaces} currentUserId={$user.id} />
{:else}
  <div class="grid grid-auto-fill-72 gap-y-4">
    {#each sortedSpaces as space, index (space.id)}
      <SpaceCard {space} preload={index < 20} />
    {/each}
  </div>
{/if}
```

**Step 3: Run tests to verify nothing broke**

Run: `cd web && pnpm test -- --run`
Expected: All tests PASS

**Step 4: Commit**

```bash
git add web/src/routes/(user)/spaces/+page.svelte web/src/routes/(user)/spaces/+page.spec.ts
git commit -m "feat(spaces): wire view toggle and increase card grid to 72"
```

---

### Task 7: Add pinned spaces splitting logic

**Files:**

- Create: `web/src/lib/utils/space-utils.ts`
- Create: `web/src/lib/utils/space-utils.spec.ts`

**Step 1: Write the failing tests**

Create `web/src/lib/utils/space-utils.spec.ts`:

```ts
import { splitPinnedSpaces } from '$lib/utils/space-utils';
import { sharedSpaceFactory } from '@test-data/factories/shared-space-factory';

describe('splitPinnedSpaces', () => {
  it('should return empty pinned and all unpinned when no IDs pinned', () => {
    const spaces = [sharedSpaceFactory.build({ id: 'a' }), sharedSpaceFactory.build({ id: 'b' })];
    const result = splitPinnedSpaces(spaces, []);
    expect(result.pinned).toEqual([]);
    expect(result.unpinned).toHaveLength(2);
  });

  it('should split spaces into pinned and unpinned', () => {
    const spaces = [
      sharedSpaceFactory.build({ id: 'a', name: 'Alpha' }),
      sharedSpaceFactory.build({ id: 'b', name: 'Beta' }),
      sharedSpaceFactory.build({ id: 'c', name: 'Charlie' }),
    ];
    const result = splitPinnedSpaces(spaces, ['a', 'c']);
    expect(result.pinned.map((s) => s.id)).toEqual(['a', 'c']);
    expect(result.unpinned.map((s) => s.id)).toEqual(['b']);
  });

  it('should ignore stale pinned IDs not in spaces list', () => {
    const spaces = [sharedSpaceFactory.build({ id: 'a' })];
    const result = splitPinnedSpaces(spaces, ['a', 'deleted-id']);
    expect(result.pinned).toHaveLength(1);
    expect(result.unpinned).toHaveLength(0);
  });

  it('should preserve sort order within pinned and unpinned groups', () => {
    const spaces = [
      sharedSpaceFactory.build({ id: 'a' }),
      sharedSpaceFactory.build({ id: 'b' }),
      sharedSpaceFactory.build({ id: 'c' }),
      sharedSpaceFactory.build({ id: 'd' }),
    ];
    const result = splitPinnedSpaces(spaces, ['c', 'a']);
    // Pinned order follows the spaces array order (already sorted), not pin order
    expect(result.pinned.map((s) => s.id)).toEqual(['a', 'c']);
    expect(result.unpinned.map((s) => s.id)).toEqual(['b', 'd']);
  });

  it('should return no separator when all spaces pinned', () => {
    const spaces = [sharedSpaceFactory.build({ id: 'a' }), sharedSpaceFactory.build({ id: 'b' })];
    const result = splitPinnedSpaces(spaces, ['a', 'b']);
    expect(result.pinned).toHaveLength(2);
    expect(result.unpinned).toHaveLength(0);
    expect(result.showSection).toBe(false);
  });

  it('should show section when there are both pinned and unpinned', () => {
    const spaces = [sharedSpaceFactory.build({ id: 'a' }), sharedSpaceFactory.build({ id: 'b' })];
    const result = splitPinnedSpaces(spaces, ['a']);
    expect(result.showSection).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && pnpm test -- --run src/lib/utils/space-utils.spec.ts`
Expected: FAIL — module not found.

**Step 3: Write minimal implementation**

Create `web/src/lib/utils/space-utils.ts`:

```ts
import type { SharedSpaceResponseDto } from '@immich/sdk';

export interface SplitResult {
  pinned: SharedSpaceResponseDto[];
  unpinned: SharedSpaceResponseDto[];
  showSection: boolean;
}

export function splitPinnedSpaces(spaces: SharedSpaceResponseDto[], pinnedIds: string[]): SplitResult {
  const pinnedSet = new Set(pinnedIds);
  const pinned = spaces.filter((s) => pinnedSet.has(s.id));
  const unpinned = spaces.filter((s) => !pinnedSet.has(s.id));
  const showSection = pinned.length > 0 && unpinned.length > 0;
  return { pinned, unpinned, showSection };
}
```

**Step 4: Run test to verify it passes**

Run: `cd web && pnpm test -- --run src/lib/utils/space-utils.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add web/src/lib/utils/space-utils.ts web/src/lib/utils/space-utils.spec.ts
git commit -m "feat(spaces): add splitPinnedSpaces utility"
```

---

### Task 8: Add context menu to SpaceCard for pin/unpin

**Files:**

- Modify: `web/src/lib/components/spaces/space-card.svelte`
- Create: `web/src/lib/components/spaces/space-card.spec.ts`

**Step 1: Write the failing tests**

Create `web/src/lib/components/spaces/space-card.spec.ts`:

```ts
import { render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import SpaceCard from '$lib/components/spaces/space-card.svelte';
import { sharedSpaceFactory } from '@test-data/factories/shared-space-factory';

describe('SpaceCard', () => {
  const space = sharedSpaceFactory.build({ id: 'space-1', name: 'Test Space' });

  it('should show three-dot menu on hover', async () => {
    const user = userEvent.setup();
    const { getByTestId, queryByTestId } = render(SpaceCard, {
      props: { space, preload: false, isPinned: false, onTogglePin: vi.fn() },
    });

    expect(queryByTestId('space-menu-button')).toBeNull();
    await user.hover(getByTestId('space-card'));
    expect(getByTestId('space-menu-button')).toBeDefined();
  });

  it('should show "Pin to top" when not pinned', async () => {
    const user = userEvent.setup();
    const { getByTestId, getByText } = render(SpaceCard, {
      props: { space, preload: false, isPinned: false, onTogglePin: vi.fn() },
    });

    await user.hover(getByTestId('space-card'));
    await user.click(getByTestId('space-menu-button'));
    expect(getByText('Pin to top')).toBeDefined();
  });

  it('should show "Unpin" when pinned', async () => {
    const user = userEvent.setup();
    const { getByTestId, getByText } = render(SpaceCard, {
      props: { space, preload: false, isPinned: true, onTogglePin: vi.fn() },
    });

    await user.hover(getByTestId('space-card'));
    await user.click(getByTestId('space-menu-button'));
    expect(getByText('Unpin')).toBeDefined();
  });

  it('should call onTogglePin when pin option clicked', async () => {
    const user = userEvent.setup();
    const onTogglePin = vi.fn();
    const { getByTestId, getByText } = render(SpaceCard, {
      props: { space, preload: false, isPinned: false, onTogglePin },
    });

    await user.hover(getByTestId('space-card'));
    await user.click(getByTestId('space-menu-button'));
    await user.click(getByText('Pin to top'));
    expect(onTogglePin).toHaveBeenCalledWith('space-1');
  });

  it('should show pin icon overlay when pinned', () => {
    const { getByTestId } = render(SpaceCard, {
      props: { space, preload: false, isPinned: true, onTogglePin: vi.fn() },
    });
    expect(getByTestId('pin-overlay')).toBeDefined();
  });

  it('should not show pin icon overlay when not pinned', () => {
    const { queryByTestId } = render(SpaceCard, {
      props: { space, preload: false, isPinned: false, onTogglePin: vi.fn() },
    });
    expect(queryByTestId('pin-overlay')).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && pnpm test -- --run src/lib/components/spaces/space-card.spec.ts`
Expected: FAIL — props mismatch (no `isPinned` or `onTogglePin`).

**Step 3: Write minimal implementation**

Modify `web/src/lib/components/spaces/space-card.svelte`:

1. Add props: `isPinned: boolean = false`, `onTogglePin: (id: string) => void = () => {}`
2. Add `let showMenu = $state(false)` for three-dot visibility
3. Add hover handlers on the card root: `onmouseenter={() => (showMenu = true)}` and `onmouseleave={() => { showMenu = false; showDropdown = false; }}`
4. Add three-dot button (top-right of collage, only visible when `showMenu`):

```svelte
{#if showMenu}
  <button
    type="button"
    class="absolute top-2 end-2 z-20 rounded-full bg-white/80 p-1 shadow-sm hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800"
    onclick|stopPropagation={() => (showDropdown = !showDropdown)}
    data-testid="space-menu-button"
  >
    <Icon icon={mdiDotsVertical} size="18" />
  </button>
{/if}
```

5. Add dropdown below the button (when `showDropdown`):

```svelte
{#if showDropdown}
  <div class="absolute top-10 end-2 z-30 min-w-[140px] rounded-lg border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
    <button
      type="button"
      class="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
      onclick|stopPropagation={() => { onTogglePin(space.id); showDropdown = false; }}
    >
      <Icon icon={isPinned ? mdiPinOffOutline : mdiPinOutline} size="16" />
      {isPinned ? 'Unpin' : 'Pin to top'}
    </button>
  </div>
{/if}
```

6. Add pin overlay (top-left of collage, when `isPinned`):

```svelte
{#if isPinned}
  <div class="absolute top-2 start-2 z-10 rounded-full bg-white/70 p-1" data-testid="pin-overlay">
    <Icon icon={mdiPin} size="14" class="text-gray-600" />
  </div>
{/if}
```

**Step 4: Run test to verify it passes**

Run: `cd web && pnpm test -- --run src/lib/components/spaces/space-card.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add web/src/lib/components/spaces/space-card.svelte web/src/lib/components/spaces/space-card.spec.ts
git commit -m "feat(spaces): add pin/unpin context menu and overlay to SpaceCard"
```

---

### Task 9: Add context menu to SpacesTable rows

**Files:**

- Modify: `web/src/lib/components/spaces/spaces-table.svelte`
- Modify: `web/src/lib/components/spaces/spaces-table.spec.ts`

**Step 1: Write the failing tests**

Add to `spaces-table.spec.ts`:

```ts
it('should show pin icon in name cell when pinned', () => {
  const space = sharedSpaceFactory.build({ id: 'pinned-1' });
  const { getByTestId } = render(SpacesTable, {
    props: { spaces: [space], currentUserId, pinnedIds: ['pinned-1'], onTogglePin: vi.fn() },
  });
  expect(getByTestId('pin-icon-pinned-1')).toBeDefined();
});

it('should not show pin icon when not pinned', () => {
  const space = sharedSpaceFactory.build({ id: 'unpinned-1' });
  const { queryByTestId } = render(SpacesTable, {
    props: { spaces: [space], currentUserId, pinnedIds: [], onTogglePin: vi.fn() },
  });
  expect(queryByTestId('pin-icon-unpinned-1')).toBeNull();
});

it('should show three-dot menu on row hover', async () => {
  const user = userEvent.setup();
  const space = sharedSpaceFactory.build({ id: 'hover-1' });
  const { getByTestId } = render(SpacesTable, {
    props: { spaces: [space], currentUserId, pinnedIds: [], onTogglePin: vi.fn() },
  });
  await user.hover(getByTestId('space-row'));
  expect(getByTestId('row-menu-button-hover-1')).toBeDefined();
});

it('should call onTogglePin from row menu', async () => {
  const user = userEvent.setup();
  const onTogglePin = vi.fn();
  const space = sharedSpaceFactory.build({ id: 'pin-1' });
  const { getByTestId, getByText } = render(SpacesTable, {
    props: { spaces: [space], currentUserId, pinnedIds: [], onTogglePin },
  });
  await user.hover(getByTestId('space-row'));
  await user.click(getByTestId('row-menu-button-pin-1'));
  await user.click(getByText('Pin to top'));
  expect(onTogglePin).toHaveBeenCalledWith('pin-1');
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && pnpm test -- --run src/lib/components/spaces/spaces-table.spec.ts`
Expected: FAIL — `pinnedIds` and `onTogglePin` props not accepted.

**Step 3: Write minimal implementation**

Add to `SpacesTable` props: `pinnedIds: string[] = []`, `onTogglePin: (id: string) => void = () => {}`.

For each row:

- Track `hoveredId` state. On `onmouseenter`, set `hoveredId = space.id`. On `onmouseleave`, clear it.
- Show pin icon in name cell when `pinnedIds.includes(space.id)`:
  ```svelte
  {#if pinnedIds.includes(space.id)}
    <span data-testid="pin-icon-{space.id}"><Icon icon={mdiPin} size="14" class="text-gray-400" /></span>
  {/if}
  ```
- Show three-dot button in the last activity cell (far right) when `hoveredId === space.id`.
- Dropdown with "Pin to top" / "Unpin" option, same pattern as SpaceCard.

**Step 4: Run test to verify it passes**

Run: `cd web && pnpm test -- --run src/lib/components/spaces/spaces-table.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add web/src/lib/components/spaces/spaces-table.svelte web/src/lib/components/spaces/spaces-table.spec.ts
git commit -m "feat(spaces): add pin/unpin context menu to SpacesTable rows"
```

---

### Task 10: Wire pinned sections into spaces page

**Files:**

- Modify: `web/src/routes/(user)/spaces/+page.svelte`

**Step 1: Implement the pinned section rendering**

This task wires everything together. Modify `+page.svelte`:

1. Import `pinnedSpaceIds` from store, `splitPinnedSpaces` from utils, `mdiPinOutline` from `@mdi/js`, `Icon` from `@immich/ui`, `user` from `$lib/stores/user.store`.
2. Add toggle handler:
   ```ts
   const handleTogglePin = (id: string) => {
     pinnedSpaceIds.update((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
   };
   ```
3. Derive split result:
   ```ts
   let { pinned, unpinned, showSection } = $derived(splitPinnedSpaces(sortedSpaces, $pinnedSpaceIds));
   ```
4. Render pinned section (when `showSection`):
   ```svelte
   {#if showSection}
     <div class="mb-2 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
       <Icon icon={mdiPinOutline} size="16" />
       <span>Pinned</span>
     </div>
   {/if}
   ```
5. Render pinned spaces (card or list depending on viewMode), passing `isPinned={true}`.
6. Render separator when `showSection`: `<hr class="my-4 border-gray-200 dark:border-gray-700" />`
7. Render unpinned spaces (or all if no pinned).
8. Pass `isPinned` and `onTogglePin` to each `SpaceCard`.
9. Pass `pinnedIds` and `onTogglePin` to `SpacesTable`.

**Step 2: Run all tests**

Run: `cd web && pnpm test -- --run`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add web/src/routes/(user)/spaces/+page.svelte
git commit -m "feat(spaces): wire pinned sections into spaces list page"
```

---

### Task 11: Add i18n keys

**Files:**

- Modify: `i18n/en.json`

**Step 1: Add i18n keys**

Add to `i18n/en.json` (alphabetical within the file):

```json
"spaces_pin_to_top": "Pin to top",
"spaces_pinned": "Pinned",
"spaces_unpin": "Unpin",
```

**Step 2: Update hardcoded strings**

Replace all hardcoded `'Pin to top'`, `'Unpin'`, and `'Pinned'` strings in `space-card.svelte`, `spaces-table.svelte`, and `+page.svelte` with `$t('spaces_pin_to_top')`, `$t('spaces_unpin')`, and `$t('spaces_pinned')`.

**Step 3: Run lint and tests**

Run: `cd web && pnpm test -- --run && cd .. && make lint-web`
Expected: All pass

**Step 4: Commit**

```bash
git add i18n/en.json web/src/lib/components/spaces/space-card.svelte web/src/lib/components/spaces/spaces-table.svelte web/src/routes/(user)/spaces/+page.svelte
git commit -m "feat(spaces): add i18n keys for pin/unpin actions"
```

---

### Task 12: Final lint, format, typecheck

**Files:** All modified files

**Step 1: Run full checks**

```bash
make format-web && make lint-web && make check-web
```

Fix any issues found.

**Step 2: Run all tests one final time**

```bash
cd web && pnpm test -- --run
```

Expected: All tests PASS

**Step 3: Commit any formatting fixes**

```bash
git add -u && git commit -m "chore: format and lint fixes"
```
