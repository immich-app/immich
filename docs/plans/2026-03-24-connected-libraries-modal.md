# Connected Libraries Modal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move the connected-libraries UI from a hidden panel tab into a discoverable dropdown menu item that opens a modal dialog.

**Architecture:** Remove the Libraries tab from the existing 3-tab space panel. Add a "Link Libraries" menu item to the dropdown menu (next to "Add All Photos"). Clicking it opens a modal containing the existing `SpaceLinkedLibraries` component with a local re-fetch pattern for reactivity.

**Tech Stack:** Svelte 5, `@immich/ui` (Modal, ModalBody), `@immich/sdk`

---

### Task 1: Create SpaceLinkedLibrariesModal with tests

**Files:**

- Create: `web/src/lib/modals/SpaceLinkedLibrariesModal.spec.ts`
- Create: `web/src/lib/modals/SpaceLinkedLibrariesModal.svelte`

**Step 1: Write failing tests**

Create `web/src/lib/modals/SpaceLinkedLibrariesModal.spec.ts`:

```typescript
import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import '$lib/__mocks__/sdk.mock';
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { getVisualViewportMock } from '$lib/__mocks__/visual-viewport.mock';

vi.mock('svelte-persisted-store', async () => {
  const { writable } = await import('svelte/store');
  return {
    persisted: (_key: string, initialValue: unknown) => writable(initialValue),
  };
});

vi.mock('$lib/utils/tunables', () => ({
  TUNABLES: {
    LAYOUT: { WASM: true },
    TIMELINE: { INTERSECTION_EXPAND_TOP: 500, INTERSECTION_EXPAND_BOTTOM: 500 },
  },
}));

import type { SharedSpaceResponseDto } from '@immich/sdk';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import SpaceLinkedLibrariesModal from './SpaceLinkedLibrariesModal.svelte';

const makeSpace = (overrides: Partial<SharedSpaceResponseDto> = {}): SharedSpaceResponseDto => ({
  id: 'space-1',
  name: 'Family Photos',
  description: '',
  createdById: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  memberCount: 1,
  assetCount: 0,
  thumbnailAssetId: null,
  recentAssetIds: [],
  recentAssetThumbhashes: [],
  lastActivityAt: null,
  newAssetCount: 0,
  members: [],
  linkedLibraries: [],
  ...overrides,
});

describe('SpaceLinkedLibrariesModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
    vi.stubGlobal('visualViewport', getVisualViewportMock());
    vi.resetAllMocks();
    Element.prototype.animate = getAnimateMock();
    sdkMock.getAllLibraries.mockResolvedValue([]);
  });

  afterAll(async () => {
    await waitFor(() => {
      expect(document.body.style.pointerEvents).not.toBe('none');
    });
  });

  it('should render modal with "Connected Libraries" title', () => {
    render(SpaceLinkedLibrariesModal, { space: makeSpace(), onClose });
    expect(screen.getByText('Connected Libraries')).toBeInTheDocument();
  });

  it('should render the SpaceLinkedLibraries component inside', () => {
    render(SpaceLinkedLibrariesModal, { space: makeSpace(), onClose });
    expect(screen.getByTestId('linked-libraries')).toBeInTheDocument();
  });

  it('should show empty state when no libraries are linked', () => {
    render(SpaceLinkedLibrariesModal, { space: makeSpace(), onClose });
    expect(screen.getByText('No libraries connected yet')).toBeInTheDocument();
  });

  it('should show linked libraries when present', () => {
    const space = makeSpace({
      linkedLibraries: [{ libraryId: 'lib-1', libraryName: 'My Photos' }],
    });
    render(SpaceLinkedLibrariesModal, { space, onClose });
    expect(screen.getByText('My Photos')).toBeInTheDocument();
  });

  it('should call onClose with false when closed without changes', async () => {
    render(SpaceLinkedLibrariesModal, { space: makeSpace(), onClose });
    const closeButtons = screen.getAllByRole('button', { name: 'Close' });
    await fireEvent.click(closeButtons[0]);
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledWith(false);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd web && pnpm test -- --run src/lib/modals/SpaceLinkedLibrariesModal.spec.ts`
Expected: FAIL — `SpaceLinkedLibrariesModal` module not found.

**Step 3: Create the modal component**

Create `web/src/lib/modals/SpaceLinkedLibrariesModal.svelte`:

```svelte
<script lang="ts">
  import SpaceLinkedLibraries from '$lib/components/spaces/space-linked-libraries.svelte';
  import { getSpace, type SharedSpaceResponseDto } from '@immich/sdk';
  import { Modal, ModalBody } from '@immich/ui';
  import { mdiBookshelf } from '@mdi/js';

  interface Props {
    space: SharedSpaceResponseDto;
    onClose: (changed?: boolean) => void;
  }

  let { space: initialSpace, onClose }: Props = $props();

  let spaceData = $state(initialSpace);
  let changed = $state(false);

  const handleChanged = async () => {
    changed = true;
    spaceData = await getSpace({ id: spaceData.id });
  };
</script>

<Modal title="Connected Libraries" icon={mdiBookshelf} onClose={() => onClose(changed)}>
  <ModalBody>
    <SpaceLinkedLibraries space={spaceData} onChanged={handleChanged} />
  </ModalBody>
</Modal>
```

**Step 4: Run tests to verify they pass**

Run: `cd web && pnpm test -- --run src/lib/modals/SpaceLinkedLibrariesModal.spec.ts`
Expected: All 5 tests PASS.

**Step 5: Commit**

```bash
git add web/src/lib/modals/SpaceLinkedLibrariesModal.spec.ts web/src/lib/modals/SpaceLinkedLibrariesModal.svelte
git commit -m "feat: add SpaceLinkedLibrariesModal with tests"
```

---

### Task 2: Remove Libraries tab from space-panel (test first)

**Files:**

- Modify: `web/src/lib/components/spaces/space-panel.spec.ts`
- Modify: `web/src/lib/components/spaces/space-panel.svelte`

**Step 1: Write failing regression test**

Add the `user` store import at the top of `web/src/lib/components/spaces/space-panel.spec.ts`:

```typescript
import { user } from '$lib/stores/user.store';
```

Add these tests inside the existing `describe` block:

```typescript
it('should only render Activity and Members tabs for admin users', () => {
  // Set user as admin to ensure the Libraries tab would render if it still existed
  user.set({ id: 'u1', isAdmin: true, name: 'Admin', email: 'admin@test.com' } as any);
  renderPanel(defaultProps);
  const tabSwitcher = screen.getByTestId('tab-switcher');
  const tabs = tabSwitcher.querySelectorAll('button');
  expect(tabs).toHaveLength(2);
  expect(tabs[0]).toHaveTextContent('Activity');
  expect(tabs[1]).toHaveTextContent(/^Members/);
});

it('should not render a Libraries tab', () => {
  user.set({ id: 'u1', isAdmin: true, name: 'Admin', email: 'admin@test.com' } as any);
  renderPanel(defaultProps);
  expect(screen.queryByTestId('tab-libraries')).not.toBeInTheDocument();
});
```

**Step 2: Run tests to verify the tab count test fails**

Run: `cd web && pnpm test -- --run src/lib/components/spaces/space-panel.spec.ts`
Expected: "should only render Activity and Members tabs for admin users" FAILS — with `isAdmin: true`, 3 tabs render (Activity, Members, Libraries) but the test expects 2.

**Step 3: Verify no E2E tests reference the Libraries tab**

Run: `grep -r "tab-libraries" e2e/ || echo "No E2E references found"`
Expected: No references found. Safe to remove.

**Step 4: Remove Libraries tab from space-panel.svelte**

In `web/src/lib/components/spaces/space-panel.svelte`:

1. Remove the `SpaceLinkedLibraries` import (line 5)
2. Remove `onLibrariesChanged` from Props interface (line 34) and destructuring (line 48-49: `onLibrariesChanged = () => {}`)
3. Remove the `isAdmin` derived variable (line 54) — it is only used by the Libraries tab
4. Change `activeTab` type (line 53):

```typescript
let activeTab = $state<'activity' | 'members'>('activity');
```

5. Remove the Libraries tab button — the entire `{#if isAdmin}` block (lines 173-184):

```svelte
<!-- DELETE THIS BLOCK -->
{#if isAdmin}
  <button
    type="button"
    class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {activeTab === 'libraries'
      ? activeTabClass
      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}"
    onclick={() => (activeTab = 'libraries')}
    data-testid="tab-libraries"
  >
    Libraries
  </button>
{/if}
```

6. Remove the libraries tab content (around line 207-208):

```svelte
<!-- DELETE THIS BLOCK -->
{:else if activeTab === 'libraries'}
  <SpaceLinkedLibraries {space} onChanged={onLibrariesChanged} />
```

7. Remove the `import { user } from '$lib/stores/user.store'` if it's no longer used (check if `$user` is referenced elsewhere in the file — it's used for `isAdmin` only, so remove it).

**Step 5: Run tests to verify they pass**

Run: `cd web && pnpm test -- --run src/lib/components/spaces/space-panel.spec.ts`
Expected: All tests PASS including the new regression tests.

**Step 6: Commit**

```bash
git add web/src/lib/components/spaces/space-panel.spec.ts web/src/lib/components/spaces/space-panel.svelte
git commit -m "refactor: remove Libraries tab from space panel"
```

---

### Task 3: Add "Link Libraries" menu item to dropdown

**Files:**

- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`

**Testing note:** The space page component (`+page.svelte`) has deep dependencies on routing, TimelineManager, Socket.IO, and other infrastructure that make unit testing impractical. The admin gating (`$user?.isAdmin`) follows the same pattern as other admin checks in the codebase. The modal itself is fully tested in Task 1. The admin gating behavior will be verified manually and covered by the type check in Task 4.

**Step 1: Add imports**

At the top of the `<script>` block, add:

```typescript
import SpaceLinkedLibrariesModal from '$lib/modals/SpaceLinkedLibrariesModal.svelte';
```

Add `mdiBookshelf` to the existing `@mdi/js` import.

**Step 2: Add the handler function**

Add after the `handleBulkAddAssets` function (which ends at line 419):

```typescript
const handleLinkLibraries = async () => {
  const changed = await modalManager.show(SpaceLinkedLibrariesModal, { space });
  if (changed) {
    await refreshSpace();
    await loadActivities();
  }
};
```

**Step 3: Restructure the dropdown menu**

In the `ButtonContextMenu` (line 642), replace the current menu structure with:

```svelte
<ButtonContextMenu direction="left" align="top-right" color="secondary" title="More" icon={mdiDotsVertical}>
  <MenuOption
    text={showInTimeline ? $t('spaces_hide_from_timeline') : $t('spaces_show_on_timeline')}
    icon={showInTimeline ? mdiEyeOutline : mdiEyeOffOutline}
    onClick={handleToggleTimeline}
  />
  {#if isEditor || $user?.isAdmin}
    <hr class="my-1 border-gray-300" />
  {/if}
  {#if isEditor}
    <MenuOption text={$t('add_all_photos')} icon={mdiImageMultipleOutline} onClick={handleBulkAddAssets} />
  {/if}
  {#if $user?.isAdmin}
    <MenuOption text="Link Libraries" icon={mdiBookshelf} onClick={handleLinkLibraries} />
  {/if}
  {#if isOwner}
    <hr class="my-1 border-gray-300" />
    <MenuOption
      text="People"
      icon={mdiFaceRecognition}
      textColor={space.faceRecognitionEnabled ? 'text-immich-primary' : undefined}
      onClick={handleToggleFaceRecognition}
    />
    {#if space.faceRecognitionEnabled}
      <MenuOption
        text="Pets"
        icon={mdiPaw}
        textColor={space.petsEnabled ? 'text-immich-primary' : undefined}
        onClick={handleTogglePets}
      />
    {/if}
    <hr class="my-1 border-gray-300" />
    <MenuOption
      text={$t('spaces_delete')}
      icon={mdiDeleteOutline}
      textColor="text-red-500"
      onClick={handleDelete}
    />
  {/if}
</ButtonContextMenu>
```

Notes:

- The `<hr>` divider shows when either `isEditor` or `$user?.isAdmin` is true, so non-editor admins still get a visual separator before "Link Libraries".
- `$user?.isAdmin` comes from the already-imported `user` store (line 39). There is no local `isAdmin` variable on this page.
- The `handleLinkLibraries` handler calls `refreshSpace()` + `loadActivities()` only when the modal reports changes, keeping the activity feed in sync.

**Step 4: Remove `onLibrariesChanged` from SpacePanel usage**

At line 864, remove the `onLibrariesChanged` prop from the `<SpacePanel>` component:

```svelte
<SpacePanel
  {space}
  {members}
  {activities}
  currentUserId={$user.id}
  {isOwner}
  open={panelOpen}
  onClose={() => (panelOpen = false)}
  onMembersChanged={async () => {
    members = await getMembers({ id: space.id });
    await refreshSpace();
    await loadActivities();
  }}
  onLoadMoreActivities={loadMoreActivities}
  {hasMoreActivities}
/>
```

**Step 5: Commit**

```bash
git add web/src/routes/\(user\)/spaces/\[spaceId\]/\[\[photos=photos\]\]/\[\[assetId=id\]\]/+page.svelte
git commit -m "feat: add Link Libraries menu item to space dropdown"
```

---

### Task 4: Lint, format, and verify all tests pass

**Step 1: Run prettier**

Run: `cd web && npx prettier --write src/lib/modals/SpaceLinkedLibrariesModal.svelte src/lib/modals/SpaceLinkedLibrariesModal.spec.ts src/lib/components/spaces/space-panel.svelte src/lib/components/spaces/space-panel.spec.ts "src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte"`

**Step 2: Run linter**

Run: `cd web && npx eslint --max-warnings 0 src/lib/modals/SpaceLinkedLibrariesModal.svelte src/lib/modals/SpaceLinkedLibrariesModal.spec.ts src/lib/components/spaces/space-panel.svelte src/lib/components/spaces/space-panel.spec.ts "src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte"`
Expected: No errors or warnings.

**Step 3: Run all web tests**

Run: `cd web && pnpm test`
Expected: All tests pass.

**Step 4: Run type check**

Run: `cd web && npx svelte-check --tsconfig tsconfig.json 2>&1 | tail -20`
Expected: No new errors.

**Step 5: Fix any issues and commit if needed**

```bash
git add -u
git commit -m "chore: lint and format connected libraries changes"
```
