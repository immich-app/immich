# Unify Space People Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reuse shared frontend people-management components for global people and space people while exposing space-person alias and birth-date capabilities.

**Architecture:** Add shared people components under `web/src/lib/components/people/` and keep current route/component paths as adapters to reduce rebase conflicts. Backend runtime/API behavior stays unchanged; only backend regression tests are added for shared-space birth-date support.

**Tech Stack:** Svelte 5, SvelteKit, Vitest, Testing Library, TypeScript, NestJS controller/service tests, existing `@immich/sdk` methods.

---

## File Structure

Create shared frontend component files:

- `web/src/lib/components/people/people-types.ts`: shared view-model and visibility save result types.
- `web/src/lib/components/people/people-grid.svelte`: generic grid and pagination sentinel.
- `web/src/lib/components/people/person-tile.svelte`: thumbnail/link/badge/action-menu shell.
- `web/src/lib/components/people/people-visibility-modal.svelte`: shared visibility modal behavior with adapter-controlled grid and button classes.
- `web/src/lib/components/people/people-grid.test-wrapper.svelte`: test wrapper for grid snippets.
- `web/src/lib/components/people/person-tile.test-wrapper.svelte`: test wrapper for tile snippets.
- `web/src/lib/components/people/people-visibility-modal.test-wrapper.svelte`: test wrapper with `TooltipProvider`.

Create shared frontend tests:

- `web/src/lib/components/people/people-grid.spec.ts`
- `web/src/lib/components/people/person-tile.spec.ts`
- `web/src/lib/components/people/people-visibility-modal.spec.ts`

Modify global people adapters:

- `web/src/routes/(user)/people/people-infinite-scroll.svelte`: delegate to `PeopleGrid`.
- `web/src/routes/(user)/people/people-card.svelte`: delegate to `PersonTile`.
- `web/src/routes/(user)/people/manage-people-visibility.svelte`: delegate to `PeopleVisibilityModal`.
- `web/src/routes/(user)/people/manage-people-visibility.spec.ts`: add save adapter coverage.

Create or modify global adapter tests:

- `web/src/routes/(user)/people/people-card.spec.ts`
- `web/src/routes/(user)/people/people-infinite-scroll.spec.ts`
- `web/src/routes/(user)/people/people-infinite-scroll.test-wrapper.svelte`

Modify space people adapters:

- `web/src/routes/(user)/spaces/[spaceId]/people/+page.svelte`: use `PeopleGrid` and `PersonTile`.
- `web/src/lib/components/spaces/manage-space-people-visibility.svelte`: delegate to `PeopleVisibilityModal`.
- `web/src/lib/components/spaces/space-people-page.spec.ts`: add alias/canonical-name coverage.
- `web/src/lib/components/spaces/manage-space-people-visibility.spec.ts`: keep existing visibility coverage and add alias display coverage.

Create space person detail component and tests:

- `web/src/lib/components/spaces/space-person-profile.svelte`: alias and birth-date display/edit controls for the detail page.
- `web/src/lib/components/spaces/space-person-profile.spec.ts`: focused detail behavior tests.

Modify space person detail route:

- `web/src/routes/(user)/spaces/[spaceId]/people/[personId]/+page.svelte`: render `SpacePersonProfile` in the non-merge detail header.

Add backend regression tests:

- `server/src/services/shared-space.service.spec.ts`: shared-space birth-date update pass-through.
- `server/src/controllers/shared-space.controller.spec.ts`: shared-space empty birth-date maps to `null`.

Do not modify these files:

- `open-api/typescript-sdk/src/fetch-client.ts`
- `server/src/dtos/shared-space-person.dto.ts`
- database migrations
- generated OpenAPI output

---

### Task 1: Backend Regression Coverage

**Files:**

- Modify: `server/src/services/shared-space.service.spec.ts`
- Create: `server/src/controllers/shared-space.controller.spec.ts`

- [ ] **Step 1: Add a shared-space service birth-date update regression test**

Insert this test in `server/src/services/shared-space.service.spec.ts` inside the `updateSpacePerson` describe block, after the existing `should update person name` test:

```ts
it('should update person birth date', async () => {
  const auth = factory.auth();
  const spaceId = newUuid();
  const personId = newUuid();
  const birthDate = '1984-05-09';
  const person = factory.sharedSpacePerson({ id: personId, spaceId });
  const updatedPerson = factory.sharedSpacePerson({ id: personId, spaceId, birthDate });

  mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
  mocks.sharedSpace.getPersonById
    .mockResolvedValueOnce(person)
    .mockResolvedValueOnce({ ...updatedPerson, personalName: null, personalThumbnailPath: null });
  mocks.sharedSpace.updatePerson.mockResolvedValue(updatedPerson);
  mocks.sharedSpace.getAlias.mockResolvedValue(void 0);
  mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

  const result = await sut.updateSpacePerson(auth, spaceId, personId, { birthDate });

  expect(result.birthDate).toBe(birthDate);
  expect(mocks.sharedSpace.updatePerson).toHaveBeenCalledWith(personId, { birthDate });
});
```

- [ ] **Step 2: Run the service regression test**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs run src/services/shared-space.service.spec.ts -t "should update person birth date"
```

Expected: the test passes against the existing backend implementation. If it fails, inspect the actual `updatePerson` call before changing runtime code.

- [ ] **Step 3: Add shared-space controller validation coverage**

Create `server/src/controllers/shared-space.controller.spec.ts` with this content:

```ts
import { SharedSpaceController } from 'src/controllers/shared-space.controller';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { SharedSpaceService } from 'src/services/shared-space.service';
import request from 'supertest';
import { factory } from 'test/small.factory';
import { automock, ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(SharedSpaceController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(SharedSpaceService);

  beforeAll(async () => {
    ctx = await controllerSetup(SharedSpaceController, [
      { provide: SharedSpaceService, useValue: service },
      { provide: LoggingRepository, useValue: automock(LoggingRepository, { strict: false }) },
    ]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('PUT /shared-spaces/:id/people/:personId', () => {
    it('should map an empty birthDate to null', async () => {
      const spaceId = factory.uuid();
      const personId = factory.uuid();

      await request(ctx.getHttpServer()).put(`/shared-spaces/${spaceId}/people/${personId}`).send({ birthDate: '' });

      expect(service.updateSpacePerson).toHaveBeenCalledWith(undefined, spaceId, personId, { birthDate: null });
    });
  });
});
```

- [ ] **Step 4: Run the controller regression test**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs run src/controllers/shared-space.controller.spec.ts
```

Expected: the test passes. If authentication behavior differs from `PersonController` tests, set `Authorization: Bearer token` and keep the same assertion against `service.updateSpacePerson`.

- [ ] **Step 5: Commit backend regression coverage**

Run:

```bash
git add server/src/services/shared-space.service.spec.ts server/src/controllers/shared-space.controller.spec.ts
git commit -m "test: cover shared space person birth date"
```

---

### Task 2: Shared People Components

**Files:**

- Create: `web/src/lib/components/people/people-types.ts`
- Create: `web/src/lib/components/people/people-grid.svelte`
- Create: `web/src/lib/components/people/person-tile.svelte`
- Create: `web/src/lib/components/people/people-visibility-modal.svelte`
- Create: `web/src/lib/components/people/people-grid.test-wrapper.svelte`
- Create: `web/src/lib/components/people/person-tile.test-wrapper.svelte`
- Create: `web/src/lib/components/people/people-visibility-modal.test-wrapper.svelte`
- Create: `web/src/lib/components/people/people-grid.spec.ts`
- Create: `web/src/lib/components/people/person-tile.spec.ts`
- Create: `web/src/lib/components/people/people-visibility-modal.spec.ts`

Commit boundaries:

- Commit 2A: `people-types.ts`, `people-grid.svelte`, `people-grid.test-wrapper.svelte`, and `people-grid.spec.ts`.
- Commit 2B: `person-tile.svelte`, `person-tile.test-wrapper.svelte`, and `person-tile.spec.ts`.
- Commit 2C: `people-visibility-modal.svelte`, `people-visibility-modal.test-wrapper.svelte`, and `people-visibility-modal.spec.ts`.

- [ ] **Step 1: Write the failing grid test**

Create `web/src/lib/components/people/people-grid.spec.ts`:

```ts
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import PeopleGridWrapper from './people-grid.test-wrapper.svelte';

describe('PeopleGrid', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
  });

  it('renders items through the child snippet', () => {
    render(PeopleGridWrapper, {
      props: {
        items: [
          { id: 'p1', label: 'Alice' },
          { id: 'p2', label: 'Bob' },
        ],
        loadNextPage: vi.fn(),
      },
    });

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows loading text when loading the next page', () => {
    render(PeopleGridWrapper, {
      props: {
        items: [{ id: 'p1', label: 'Alice' }],
        hasNextPage: true,
        loading: true,
        loadNextPage: vi.fn(),
      },
    });

    expect(screen.getByText('loading')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the grid test and verify it fails**

Run:

```bash
pnpm --dir web exec vitest run src/lib/components/people/people-grid.spec.ts
```

Expected: the test fails because `people-grid.test-wrapper.svelte` and `people-grid.svelte` do not exist yet.

- [ ] **Step 3: Create shared type contracts**

Create `web/src/lib/components/people/people-types.ts`:

```ts
export type ManagedPerson = {
  id: string;
  displayName: string;
  canonicalName?: string;
  thumbnailUrl: string;
  href: string;
  isHidden: boolean;
  isFavorite?: boolean;
  type?: string;
  species?: string | null;
  assetCount?: number;
  faceCount?: number;
};

export type VisibilityPerson = Pick<ManagedPerson, 'id' | 'displayName' | 'thumbnailUrl' | 'isHidden'>;

export type VisibilityChange = {
  id: string;
  isHidden: boolean;
};

export type VisibilitySaveResult = {
  successCount: number;
  failCount: number;
};
```

- [ ] **Step 4: Create `PeopleGrid` and its test wrapper**

Create `web/src/lib/components/people/people-grid.svelte` with this contract and behavior:

```svelte
<script lang="ts" generics="T extends { id: string }">
  import type { Snippet } from 'svelte';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    items: T[];
    class?: string;
    hasNextPage?: boolean;
    loading?: boolean;
    loadNextPage: () => void;
    children?: Snippet<[T, number]>;
  }

  let {
    items,
    class: className = 'w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-10 gap-1',
    hasNextPage = false,
    loading = false,
    loadNextPage,
    children,
  }: Props = $props();
  let sentinel: HTMLElement | undefined = $state();

  const intersectionObserver = new IntersectionObserver((entries) => {
    const entry = entries.find((entry) => entry.target === sentinel);
    if (entry?.isIntersecting && hasNextPage && !loading) {
      loadNextPage();
    }
  });

  $effect(() => {
    if (sentinel) {
      intersectionObserver.disconnect();
      intersectionObserver.observe(sentinel);
    }
  });

  onDestroy(() => {
    intersectionObserver.disconnect();
  });
</script>

<div class={className}>
  {#each items as item, index (item.id)}
    {@render children?.(item, index)}
  {/each}
</div>

{#if hasNextPage}
  <div bind:this={sentinel} class="flex h-8 w-full items-center justify-center">
    {#if loading}
      <span class="text-sm text-gray-500">{$t('loading')}</span>
    {/if}
  </div>
{/if}
```

Create `web/src/lib/components/people/people-grid.test-wrapper.svelte`:

```svelte
<script lang="ts">
  import PeopleGrid from './people-grid.svelte';

  type Item = {
    id: string;
    label: string;
  };

  interface Props {
    items: Item[];
    hasNextPage?: boolean;
    loading?: boolean;
    loadNextPage: () => void;
  }

  let { items, hasNextPage = false, loading = false, loadNextPage }: Props = $props();
</script>

<PeopleGrid {items} {hasNextPage} {loading} {loadNextPage}>
  {#snippet children(item)}
    <span>{item.label}</span>
  {/snippet}
</PeopleGrid>
```

- [ ] **Step 5: Run the grid test**

Run:

```bash
pnpm --dir web exec vitest run src/lib/components/people/people-grid.spec.ts
```

Expected: the grid test passes.

- [ ] **Step 6: Commit shared grid extraction**

Run:

```bash
git add web/src/lib/components/people/people-types.ts web/src/lib/components/people/people-grid.svelte web/src/lib/components/people/people-grid.test-wrapper.svelte web/src/lib/components/people/people-grid.spec.ts
git commit -m "feat: add shared people grid"
```

- [ ] **Step 7: Write the failing tile test**

Create `web/src/lib/components/people/person-tile.spec.ts`:

```ts
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/svelte';
import PersonTileWrapper from './person-tile.test-wrapper.svelte';

const person = {
  id: 'p1',
  displayName: 'Mom',
  canonicalName: 'Alice',
  thumbnailUrl: '/thumbnail.jpg',
  href: '/people/p1',
  isHidden: false,
  isFavorite: true,
  type: 'pet',
  species: 'Dog',
};

describe('PersonTile', () => {
  it('renders link, thumbnail title, favorite badge, pet badge, and footer slot', () => {
    const { baseElement } = render(PersonTileWrapper, {
      props: {
        person,
        showFooter: true,
      },
    });

    expect(baseElement.querySelector('a[href="/people/p1"]')).toBeInTheDocument();
    expect(screen.getByTitle('Mom')).toBeInTheDocument();
    expect(screen.getByTitle('Dog')).toBeInTheDocument();
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('renders the action menu slot only on hover when provided', async () => {
    const { baseElement } = render(PersonTileWrapper, {
      props: {
        person,
        showActionMenu: true,
      },
    });

    expect(screen.queryByText('Actions')).not.toBeInTheDocument();
    await fireEvent.mouseEnter(baseElement.querySelector('[role="group"]')!);
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });
});
```

- [ ] **Step 8: Run the tile test and verify it fails**

Run:

```bash
pnpm --dir web exec vitest run src/lib/components/people/person-tile.spec.ts
```

Expected: the test fails because `person-tile.test-wrapper.svelte` and `person-tile.svelte` do not exist yet.

- [ ] **Step 9: Create `PersonTile` and its test wrapper**

Create `web/src/lib/components/people/person-tile.svelte` with this contract:

```svelte
<script lang="ts">
  import { focusOutside } from '$lib/actions/focus-outside';
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import type { ManagedPerson } from '$lib/components/people/people-types';
  import { Icon } from '@immich/ui';
  import { mdiHeart, mdiPaw } from '@mdi/js';
  import type { Snippet } from 'svelte';

  interface Props {
    person: ManagedPerson;
    showActionMenu?: boolean;
    actionMenu?: Snippet;
    footer?: Snippet;
  }

  let { person, showActionMenu = true, actionMenu, footer }: Props = $props();
  let showActions = $state(false);
</script>

<div
  class="relative"
  role="group"
  onmouseenter={() => (showActions = true)}
  onmouseleave={() => (showActions = false)}
  use:focusOutside={{ onFocusOut: () => (showActions = false) }}
>
  <a href={person.href} draggable="false" onfocus={() => (showActions = true)}>
    <div class="w-full h-full rounded-xl brightness-95 filter">
      <ImageThumbnail
        shadow
        url={person.thumbnailUrl}
        altText={person.displayName}
        title={person.displayName}
        widthStyle="100%"
        circle
        preload={false}
      />
      {#if person.isFavorite}
        <div class="absolute top-4 start-4">
          <Icon icon={mdiHeart} size="24" class="text-white" />
        </div>
      {/if}
      {#if person.type === 'pet'}
        <div
          class="absolute bottom-1 right-1 rounded-full bg-immich-primary p-1 text-white"
          title={person.species ?? undefined}
        >
          <Icon icon={mdiPaw} size="16" class="text-white" />
        </div>
      {/if}
    </div>
  </a>

  {#if showActionMenu && actionMenu && showActions}
    <div class="absolute top-2 end-2 z-1">
      {@render actionMenu()}
    </div>
  {/if}

  {@render footer?.()}
</div>
```

Create `web/src/lib/components/people/person-tile.test-wrapper.svelte`:

```svelte
<script lang="ts">
  import type { ManagedPerson } from '$lib/components/people/people-types';
  import { TooltipProvider } from '@immich/ui';
  import PersonTile from './person-tile.svelte';

  interface Props {
    person: ManagedPerson;
    showActionMenu?: boolean;
    showFooter?: boolean;
  }

  let { person, showActionMenu = false, showFooter = false }: Props = $props();
</script>

<TooltipProvider>
  <PersonTile {person} {showActionMenu}>
    {#snippet actionMenu()}
      {#if showActionMenu}
        <button type="button">Actions</button>
      {/if}
    {/snippet}

    {#snippet footer()}
      {#if showFooter}
        <p>Footer content</p>
      {/if}
    {/snippet}
  </PersonTile>
</TooltipProvider>
```

- [ ] **Step 10: Run the tile test**

Run:

```bash
pnpm --dir web exec vitest run src/lib/components/people/person-tile.spec.ts
```

Expected: the tile test passes.

- [ ] **Step 11: Commit shared tile extraction**

Run:

```bash
git add web/src/lib/components/people/person-tile.svelte web/src/lib/components/people/person-tile.test-wrapper.svelte web/src/lib/components/people/person-tile.spec.ts
git commit -m "feat: add shared person tile"
```

- [ ] **Step 12: Write the failing visibility modal test**

Create `web/src/lib/components/people/people-visibility-modal.spec.ts`:

```ts
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import PeopleVisibilityModalWrapper from './people-visibility-modal.test-wrapper.svelte';

const makePerson = (overrides = {}) => ({
  id: 'p1',
  displayName: 'Alice',
  thumbnailUrl: '/thumb.jpg',
  isHidden: false,
  ...overrides,
});

describe('PeopleVisibilityModal', () => {
  it('preserves local hidden overrides when people are appended', async () => {
    const saveVisibilityChanges = vi.fn().mockResolvedValue({ successCount: 1, failCount: 0 });
    const onUpdate = vi.fn();
    const onClose = vi.fn();
    const { rerender } = render(PeopleVisibilityModalWrapper, {
      props: {
        people: [makePerson({ id: 'p1', displayName: 'Alice' })],
        saveVisibilityChanges,
        onUpdate,
        onClose,
      },
    });

    await fireEvent.click(screen.getByTestId('visibility-person-p1'));
    expect(screen.getByTestId('visibility-person-p1')).toHaveAttribute('aria-pressed', 'true');

    await rerender({
      people: [makePerson({ id: 'p1', displayName: 'Alice' }), makePerson({ id: 'p2', displayName: 'Bob' })],
      saveVisibilityChanges,
      onUpdate,
      onClose,
    });

    expect(screen.getByTestId('visibility-person-p1')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('visibility-person-p2')).toHaveAttribute('aria-pressed', 'false');
  });

  it('saves only changed people and returns updated local people', async () => {
    const saveVisibilityChanges = vi.fn().mockResolvedValue({ successCount: 1, failCount: 0 });
    const onUpdate = vi.fn();
    const onClose = vi.fn();
    render(PeopleVisibilityModalWrapper, {
      props: {
        people: [makePerson({ id: 'p1', isHidden: false }), makePerson({ id: 'p2', isHidden: true })],
        saveVisibilityChanges,
        onUpdate,
        onClose,
      },
    });

    await fireEvent.click(screen.getByTestId('visibility-person-p1'));
    await fireEvent.click(screen.getByTestId('save-visibility'));

    await waitFor(() => {
      expect(saveVisibilityChanges).toHaveBeenCalledWith([{ id: 'p1', isHidden: true }]);
      expect(onUpdate).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'p1', isHidden: true }),
        expect.objectContaining({ id: 'p2', isHidden: true }),
      ]);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('treats displayName as the named-person value for hide unnamed', async () => {
    render(PeopleVisibilityModalWrapper, {
      props: {
        people: [makePerson({ id: 'p1', displayName: 'Alias' }), makePerson({ id: 'p2', displayName: '' })],
        saveVisibilityChanges: vi.fn().mockResolvedValue({ successCount: 1, failCount: 0 }),
        onUpdate: vi.fn(),
        onClose: vi.fn(),
      },
    });

    await fireEvent.click(screen.getByLabelText('hide_unnamed_people'));

    expect(screen.getByTestId('visibility-person-p1')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('visibility-person-p2')).toHaveAttribute('aria-pressed', 'true');
  });
});
```

- [ ] **Step 13: Run the visibility modal test and verify it fails**

Run:

```bash
pnpm --dir web exec vitest run src/lib/components/people/people-visibility-modal.spec.ts
```

Expected: the test fails because `people-visibility-modal.test-wrapper.svelte` and `people-visibility-modal.svelte` do not exist yet.

- [ ] **Step 14: Create `PeopleVisibilityModal` and wrapper**

Create `web/src/lib/components/people/people-visibility-modal.svelte` using the existing global/space modal behavior:

```svelte
<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import type { VisibilityChange, VisibilityPerson, VisibilitySaveResult } from '$lib/components/people/people-types';
  import PeopleGrid from '$lib/components/people/people-grid.svelte';
  import { ToggleVisibility } from '$lib/constants';
  import { locale } from '$lib/stores/preferences.store';
  import { handleError } from '$lib/utils/handle-error';
  import { Button, IconButton, toastManager } from '@immich/ui';
  import { mdiClose, mdiEye, mdiEyeOff, mdiEyeSettings, mdiRestart } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { SvelteMap } from 'svelte/reactivity';

  interface Props {
    people: VisibilityPerson[];
    titleId?: string | undefined;
    totalPeopleCount?: number | undefined;
    gridClass?: string;
    personButtonClass?: string;
    personStyle?: string;
    hasMore?: boolean;
    loading?: boolean;
    onClose: () => void;
    onUpdate: (people: VisibilityPerson[]) => void;
    loadNextPage?: () => void;
    saveVisibilityChanges: (changes: VisibilityChange[]) => Promise<VisibilitySaveResult>;
  }

  let {
    people,
    titleId = undefined,
    totalPeopleCount = undefined,
    gridClass = 'w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-10 gap-1',
    personButtonClass = 'group relative w-full h-full',
    personStyle = undefined,
    hasMore = false,
    loading = false,
    onClose,
    onUpdate,
    loadNextPage = () => {},
    saveVisibilityChanges,
  }: Props = $props();

  let toggleVisibility = $state(ToggleVisibility.SHOW_ALL);
  let showLoadingSpinner = $state(false);
  const overrides = new SvelteMap<string, boolean>();

  const getNextVisibility = (current: ToggleVisibility) =>
    current === ToggleVisibility.SHOW_ALL
      ? ToggleVisibility.HIDE_UNNANEMD
      : current === ToggleVisibility.HIDE_UNNANEMD
        ? ToggleVisibility.HIDE_ALL
        : ToggleVisibility.SHOW_ALL;

  const setHiddenOverride = (person: VisibilityPerson, isHidden: boolean) => {
    if (isHidden === person.isHidden) {
      overrides.delete(person.id);
      return;
    }
    overrides.set(person.id, isHidden);
  };

  const handleToggleVisibility = () => {
    toggleVisibility = getNextVisibility(toggleVisibility);
    for (const person of people) {
      let isHidden = overrides.get(person.id) ?? person.isHidden;
      if (toggleVisibility === ToggleVisibility.HIDE_ALL) {
        isHidden = true;
      } else if (toggleVisibility === ToggleVisibility.SHOW_ALL) {
        isHidden = false;
      } else if (toggleVisibility === ToggleVisibility.HIDE_UNNANEMD && !person.displayName) {
        isHidden = true;
      }
      setHiddenOverride(person, isHidden);
    }
  };

  const handleSaveVisibility = async () => {
    showLoadingSpinner = true;
    const changed = Array.from(overrides, ([id, isHidden]) => ({ id, isHidden }));
    try {
      if (changed.length > 0) {
        const { successCount, failCount } = await saveVisibilityChanges(changed);
        if (failCount > 0) {
          toastManager.warning($t('errors.unable_to_change_visibility', { values: { count: failCount } }));
        }
        toastManager.primary($t('visibility_changed', { values: { count: successCount } }));
      }
      const updatedPeople = people.map((person) => {
        const isHidden = overrides.get(person.id);
        return isHidden === undefined ? person : { ...person, isHidden };
      });
      overrides.clear();
      onUpdate(updatedPeople);
      onClose();
    } catch (error) {
      handleError(error, $t('errors.unable_to_change_visibility', { values: { count: changed.length } }));
    } finally {
      showLoadingSpinner = false;
    }
  };

  let toggleButtonOptions: Record<ToggleVisibility, { icon: string; label: string }> = $derived({
    [ToggleVisibility.HIDE_ALL]: { icon: mdiEyeOff, label: $t('hide_all_people') },
    [ToggleVisibility.HIDE_UNNANEMD]: { icon: mdiEyeSettings, label: $t('hide_unnamed_people') },
    [ToggleVisibility.SHOW_ALL]: { icon: mdiEye, label: $t('show_all_people') },
  });
  let toggleButton = $derived(toggleButtonOptions[getNextVisibility(toggleVisibility)]);
</script>
```

Use the existing modal markup from `manage-people-visibility.svelte`, replacing per-route fields with `VisibilityPerson` fields:

```svelte
<svelte:document use:shortcut={{ shortcut: { key: 'Escape' }, onShortcut: onClose }} />

<div class="h-full overflow-y-auto">
  <div class="sticky top-0 z-1 flex h-16 w-full items-center justify-between border-b bg-white p-1 dark:border-immich-dark-gray dark:bg-black dark:text-immich-dark-fg md:p-8">
    <div class="flex items-center">
      <IconButton shape="round" color="secondary" variant="ghost" aria-label={$t('close')} icon={mdiClose} onclick={onClose} data-testid="close-visibility" />
      <div class="flex gap-2 items-center">
        <p id={titleId} class="ms-2">{$t('show_and_hide_people')}</p>
        {#if totalPeopleCount !== undefined}
          <p class="text-sm text-gray-400 dark:text-gray-600">({totalPeopleCount.toLocaleString($locale)})</p>
        {/if}
      </div>
    </div>
    <div class="flex items-center justify-end">
      <div class="flex items-center md:me-4">
        <IconButton shape="round" color="secondary" variant="ghost" aria-label={$t('reset_people_visibility')} icon={mdiRestart} onclick={() => overrides.clear()} />
        <IconButton shape="round" color="secondary" variant="ghost" aria-label={toggleButton.label} icon={toggleButton.icon} onclick={handleToggleVisibility} />
      </div>
      <Button loading={showLoadingSpinner} onclick={handleSaveVisibility} size="small" data-testid="save-visibility">{$t('done')}</Button>
    </div>
  </div>

  <div class="p-2 pb-8 md:px-8">
    <PeopleGrid items={people} class={gridClass} hasNextPage={hasMore} {loading} {loadNextPage}>
      {#snippet children(person)}
        {@const hidden = overrides.get(person.id) ?? person.isHidden}
        <button
          type="button"
          class={personButtonClass}
          style={personStyle}
          onclick={() => setHiddenOverride(person, !hidden)}
          aria-pressed={hidden}
          aria-label={person.displayName ? $t('hide_named_person', { values: { name: person.displayName } }) : $t('hide_person')}
          data-testid="visibility-person-{person.id}"
        >
          <ImageThumbnail
            {hidden}
            shadow
            url={person.thumbnailUrl}
            altText={person.displayName}
            widthStyle="100%"
            hiddenIconClass="text-white group-hover:text-black transition-colors"
            preload={false}
          />
          {#if person.displayName}
            <span class="absolute bottom-2 start-0 w-full select-text px-1 text-center font-medium text-white">
              {person.displayName}
            </span>
          {/if}
        </button>
      {/snippet}
    </PeopleGrid>
  </div>
</div>
```

Create `web/src/lib/components/people/people-visibility-modal.test-wrapper.svelte`:

```svelte
<script lang="ts">
  import type { VisibilityChange, VisibilityPerson, VisibilitySaveResult } from '$lib/components/people/people-types';
  import { TooltipProvider } from '@immich/ui';
  import PeopleVisibilityModal from './people-visibility-modal.svelte';

  interface Props {
    people: VisibilityPerson[];
    onClose: () => void;
    onUpdate: (people: VisibilityPerson[]) => void;
    saveVisibilityChanges: (changes: VisibilityChange[]) => Promise<VisibilitySaveResult>;
    titleId?: string;
    totalPeopleCount?: number;
    gridClass?: string;
    personButtonClass?: string;
    personStyle?: string;
    hasMore?: boolean;
    loading?: boolean;
    loadNextPage?: () => void;
  }

  let props: Props = $props();
</script>

<TooltipProvider>
  <PeopleVisibilityModal {...props} />
</TooltipProvider>
```

- [ ] **Step 15: Run the visibility modal test**

Run:

```bash
pnpm --dir web exec vitest run src/lib/components/people/people-visibility-modal.spec.ts
```

Expected: the visibility modal test passes.

- [ ] **Step 16: Commit shared visibility modal extraction**

Run:

```bash
git add web/src/lib/components/people/people-visibility-modal.svelte web/src/lib/components/people/people-visibility-modal.test-wrapper.svelte web/src/lib/components/people/people-visibility-modal.spec.ts
git commit -m "feat: add shared people visibility modal"
```

- [ ] **Step 17: Run all shared component tests**

Run:

```bash
pnpm --dir web exec vitest run src/lib/components/people/people-grid.spec.ts src/lib/components/people/person-tile.spec.ts src/lib/components/people/people-visibility-modal.spec.ts
```

Expected: all shared component tests pass.

- [ ] **Step 18: Confirm Task 2 commit boundaries**

Run:

```bash
git log --oneline -3
```

Expected: the last three commits are `feat: add shared people grid`, `feat: add shared person tile`, and `feat: add shared people visibility modal`. Do not create an extra Task 2 commit if those commits already exist.

---

### Task 3: Global People Adapters

**Files:**

- Modify: `web/src/routes/(user)/people/people-infinite-scroll.svelte`
- Modify: `web/src/routes/(user)/people/people-card.svelte`
- Modify: `web/src/routes/(user)/people/manage-people-visibility.svelte`
- Modify: `web/src/routes/(user)/people/manage-people-visibility.spec.ts`
- Create: `web/src/routes/(user)/people/people-card.spec.ts`
- Create: `web/src/routes/(user)/people/people-infinite-scroll.spec.ts`
- Create: `web/src/routes/(user)/people/people-infinite-scroll.test-wrapper.svelte`

- [ ] **Step 1: Add global adapter tests**

Create `web/src/routes/(user)/people/people-infinite-scroll.spec.ts`:

```ts
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import { personFactory } from '@test-data/factories/person-factory';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import PeopleInfiniteScrollWrapper from './people-infinite-scroll.test-wrapper.svelte';

describe('PeopleInfiniteScroll adapter', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
  });

  it('renders global people through the shared grid', () => {
    const people = [personFactory.build({ id: 'p1', name: 'Alice' })];

    render(PeopleInfiniteScrollWrapper, {
      props: {
        people,
        loadNextPage: vi.fn(),
      },
    });

    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
```

Create `web/src/routes/(user)/people/people-card.spec.ts`:

```ts
import { personFactory } from '@test-data/factories/person-factory';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/svelte';
import PeopleCard from './people-card.svelte';

describe('PeopleCard adapter', () => {
  it('keeps global person actions available through the shared tile', async () => {
    const person = personFactory.build({ id: 'p1', name: 'Alice', isFavorite: false, type: 'person' });
    const onHidePerson = vi.fn();
    const onMergePeople = vi.fn();
    const onToggleFavorite = vi.fn();
    const { baseElement } = render(PeopleCard, {
      props: { person, onHidePerson, onMergePeople, onToggleFavorite },
    });

    await fireEvent.mouseEnter(baseElement.querySelector('[role="group"]')!);

    expect(screen.getByText('hide_person')).toBeInTheDocument();
    expect(screen.getByText('set_date_of_birth')).toBeInTheDocument();
    expect(screen.getByText('merge_people')).toBeInTheDocument();
    expect(screen.getByText('to_favorite')).toBeInTheDocument();
  });
});
```

Append this test to `web/src/routes/(user)/people/manage-people-visibility.spec.ts`:

```ts
it('saves global visibility through updatePeople', async () => {
  const onClose = vi.fn();
  const onUpdate = vi.fn();
  const loadNextPage = vi.fn();
  const person = personFactory.build({ id: 'a', name: 'Alice', isHidden: false });
  const { container } = render(ManagePeopleVisibilityWrapper, {
    props: {
      people: [person],
      totalPeopleCount: 1,
      onClose,
      onUpdate,
      loadNextPage,
    },
  });
  const user = userEvent.setup();

  await user.click(container.querySelector('button[aria-pressed]')!);
  await user.click(screen.getByTestId('save-visibility'));

  await waitFor(() => {
    expect(sdkMock.updatePeople).toHaveBeenCalledWith({ peopleUpdateDto: { people: [{ id: 'a', isHidden: true }] } });
  });
});
```

Add the missing imports to that spec:

```ts
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { screen, waitFor } from '@testing-library/svelte';
```

Create `web/src/routes/(user)/people/people-infinite-scroll.test-wrapper.svelte`:

```svelte
<script lang="ts">
  import type { PersonResponseDto } from '@immich/sdk';
  import PeopleInfiniteScroll from './people-infinite-scroll.svelte';

  interface Props {
    people: PersonResponseDto[];
    hasNextPage?: boolean;
    loadNextPage: () => void;
  }

  let { people, hasNextPage = false, loadNextPage }: Props = $props();
</script>

<PeopleInfiniteScroll {people} {hasNextPage} {loadNextPage}>
  {#snippet children({ person })}
    <span>{person.name}</span>
  {/snippet}
</PeopleInfiniteScroll>
```

- [ ] **Step 2: Run global adapter tests and verify failures**

Run:

```bash
pnpm --dir web exec vitest run 'src/routes/(user)/people/people-infinite-scroll.spec.ts' 'src/routes/(user)/people/people-card.spec.ts' 'src/routes/(user)/people/manage-people-visibility.spec.ts'
```

Expected: new tests fail until adapters delegate to shared components.

- [ ] **Step 3: Delegate `PeopleInfiniteScroll` to `PeopleGrid`**

Replace `web/src/routes/(user)/people/people-infinite-scroll.svelte` with:

```svelte
<script lang="ts">
  import PeopleGrid from '$lib/components/people/people-grid.svelte';
  import type { PersonResponseDto } from '@immich/sdk';

  interface Props {
    people: PersonResponseDto[];
    hasNextPage?: boolean | undefined;
    loadNextPage: () => void;
    children?: import('svelte').Snippet<[{ person: PersonResponseDto; index: number }]>;
  }

  let { people, hasNextPage = undefined, loadNextPage, children }: Props = $props();
</script>

<PeopleGrid items={people} hasNextPage={!!hasNextPage} {loadNextPage}>
  {#snippet children(person, index)}
    {@render children?.({ person, index })}
  {/snippet}
</PeopleGrid>
```

- [ ] **Step 4: Delegate `PeopleCard` to `PersonTile`**

In `web/src/routes/(user)/people/people-card.svelte`, add these imports:

```ts
import PersonTile from '$lib/components/people/person-tile.svelte';
import type { ManagedPerson } from '$lib/components/people/people-types';
```

Add this derived view model after `SetDateOfBirth`:

```ts
const managedPerson: ManagedPerson = $derived({
  id: person.id,
  displayName: person.name,
  canonicalName: person.name,
  thumbnailUrl: getPeopleThumbnailUrl(person),
  href: Route.viewPerson(person, { previousRoute: Route.people() }),
  isHidden: person.isHidden,
  isFavorite: person.isFavorite,
  type: person.type,
  species: person.species,
});
```

Replace the existing root markup with:

```svelte
<PersonTile person={managedPerson}>
  {#snippet actionMenu()}
    <ButtonContextMenu
      buttonClass="icon-white-drop-shadow"
      color="secondary"
      size="medium"
      variant="filled"
      icon={mdiDotsVertical}
      title={$t('show_person_options')}
    >
      <MenuOption onClick={onHidePerson} icon={mdiEyeOffOutline} text={$t('hide_person')} />
      <ActionMenuItem action={SetDateOfBirth} />
      <MenuOption onClick={onMergePeople} icon={mdiAccountMultipleCheckOutline} text={$t('merge_people')} />
      <MenuOption
        onClick={onToggleFavorite}
        icon={person.isFavorite ? mdiHeartMinusOutline : mdiHeartOutline}
        text={person.isFavorite ? $t('unfavorite') : $t('to_favorite')}
      />
    </ButtonContextMenu>
  {/snippet}
</PersonTile>
```

Remove unused imports from `people-card.svelte`: `focusOutside`, `ImageThumbnail`, `Icon`, `mdiHeart`, and `mdiPaw`.

- [ ] **Step 5: Delegate global visibility modal to `PeopleVisibilityModal`**

In `web/src/routes/(user)/people/manage-people-visibility.svelte`, replace direct modal logic with adapter mapping:

```svelte
<script lang="ts">
  import PeopleVisibilityModal from '$lib/components/people/people-visibility-modal.svelte';
  import type { VisibilityChange, VisibilityPerson, VisibilitySaveResult } from '$lib/components/people/people-types';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { updatePeople, type PersonResponseDto } from '@immich/sdk';

  interface Props {
    people: PersonResponseDto[];
    totalPeopleCount: number;
    titleId?: string | undefined;
    onClose: () => void;
    onUpdate: (people: PersonResponseDto[]) => void;
    loadNextPage: () => void;
  }

  let { people, totalPeopleCount, titleId = undefined, onClose, onUpdate, loadNextPage }: Props = $props();

  const visibilityPeople: VisibilityPerson[] = $derived(
    people.map((person) => ({
      id: person.id,
      displayName: person.name,
      thumbnailUrl: getPeopleThumbnailUrl(person),
      isHidden: person.isHidden,
    })),
  );

  const saveVisibilityChanges = async (changes: VisibilityChange[]): Promise<VisibilitySaveResult> => {
    const results = await updatePeople({ peopleUpdateDto: { people: changes } });
    const successCount = results.filter(({ success }) => success).length;
    return { successCount, failCount: results.length - successCount };
  };

  const handleUpdate = (updatedVisibilityPeople: VisibilityPerson[]) => {
    const hiddenById = new Map(updatedVisibilityPeople.map((person) => [person.id, person.isHidden]));
    onUpdate(people.map((person) => ({ ...person, isHidden: hiddenById.get(person.id) ?? person.isHidden })));
  };
</script>

<PeopleVisibilityModal
  people={visibilityPeople}
  {totalPeopleCount}
  {titleId}
  {onClose}
  onUpdate={handleUpdate}
  {loadNextPage}
  hasMore={true}
  saveVisibilityChanges={saveVisibilityChanges}
/>
```

Global intentionally uses the shared visibility modal defaults for `gridClass` and `personButtonClass`, preserving the current global grid density.

- [ ] **Step 6: Run global adapter tests**

Run:

```bash
pnpm --dir web exec vitest run 'src/routes/(user)/people/people-infinite-scroll.spec.ts' 'src/routes/(user)/people/people-card.spec.ts' 'src/routes/(user)/people/manage-people-visibility.spec.ts'
```

Expected: all global adapter tests pass.

- [ ] **Step 7: Commit global adapter migration**

Run:

```bash
git add 'web/src/routes/(user)/people'
git commit -m "refactor: adapt global people to shared components"
```

---

### Task 4: Space People Grid And Visibility Adapters

**Files:**

- Modify: `web/src/routes/(user)/spaces/[spaceId]/people/+page.svelte`
- Modify: `web/src/lib/components/spaces/space-people-page.spec.ts`
- Modify: `web/src/lib/components/spaces/manage-space-people-visibility.svelte`
- Modify: `web/src/lib/components/spaces/manage-space-people-visibility.spec.ts`

- [ ] **Step 1: Add space adapter tests for alias display and canonical-name editing**

Append these tests to `web/src/lib/components/spaces/space-people-page.spec.ts`:

```ts
it('uses alias for read-only display labels for viewers', () => {
  const people = [makePerson({ id: 'p1', name: 'Alice Johnson', alias: 'Mom' })];

  renderPage({ people, members: [makeMember({ role: SharedSpaceRole.Viewer })] });

  expect(screen.getByText('Mom')).toBeInTheDocument();
  expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
});

it('keeps editor inline rename bound to canonical name when alias exists', async () => {
  const person = makePerson({ id: 'p1', name: 'Alice Johnson', alias: 'Mom' });
  sdkMock.updateSpacePerson.mockResolvedValue(person);
  sdkMock.getSpacePeople.mockResolvedValue([person]);

  renderPage({ people: [person], members: [makeMember({ role: SharedSpaceRole.Editor })] });

  const nameInput = screen.getByDisplayValue('Alice Johnson');
  const user = userEvent.setup();
  await user.clear(nameInput);
  await user.type(nameInput, 'Alice Smith');
  await fireEvent.focusOut(nameInput);

  await waitFor(() => {
    expect(sdkMock.updateSpacePerson).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'space-1',
        personId: 'p1',
        sharedSpacePersonUpdateDto: { name: 'Alice Smith' },
      }),
    );
  });
});
```

Append this test to `web/src/lib/components/spaces/manage-space-people-visibility.spec.ts`:

```ts
it('displays alias as the visibility person name when present', () => {
  renderComponent([makePerson({ id: 'p1', name: 'Alice Johnson', alias: 'Mom' })]);

  expect(screen.getByText('Mom')).toBeInTheDocument();
  expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run space adapter tests and verify failures**

Run:

```bash
pnpm --dir web exec vitest run src/lib/components/spaces/space-people-page.spec.ts src/lib/components/spaces/manage-space-people-visibility.spec.ts
```

Expected: alias-display tests fail until the adapters map `alias || name` into shared display fields.

- [ ] **Step 3: Use shared components in the space people grid**

In `web/src/routes/(user)/spaces/[spaceId]/people/+page.svelte`, add these imports:

```ts
import PeopleGrid from '$lib/components/people/people-grid.svelte';
import PersonTile from '$lib/components/people/person-tile.svelte';
import type { ManagedPerson } from '$lib/components/people/people-types';
```

Add this helper near `getThumbUrl`:

```ts
const toManagedPerson = (person: SharedSpacePersonResponseDto): ManagedPerson => ({
  id: person.id,
  displayName: person.alias || person.name || '',
  canonicalName: person.name,
  thumbnailUrl: getThumbUrl(person),
  href: `/spaces/${space.id}/people/${person.id}`,
  isHidden: person.isHidden,
  type: person.type,
  assetCount: person.assetCount,
  faceCount: person.faceCount,
});
```

Replace the manual grid wrapper:

```svelte
<div class="grid grid-cols-2 gap-4 px-4 pt-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
```

with:

```svelte
<div class="px-4 pt-4">
  <PeopleGrid
    items={visiblePeople}
    class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8"
    hasNextPage={hasMore}
    {loading}
    loadNextPage={loadMore}
  >
    {#snippet children(person)}
      {@const managedPerson = toManagedPerson(person)}
```

Replace each card shell and thumbnail with:

```svelte
<div
  class="rounded-xl border-2 border-transparent p-2 transition-all hover:border-immich-primary/50 hover:bg-gray-200 hover:shadow-sm dark:hover:border-immich-dark-primary/25 dark:hover:bg-immich-dark-primary/20"
>
  <PersonTile person={managedPerson} showActionMenu={isEditor}>
    {#snippet actionMenu()}
      <ButtonContextMenu
        buttonClass="icon-white-drop-shadow"
        color="secondary"
        size="medium"
        variant="filled"
        icon={mdiDotsVertical}
        title={$t('show_person_options')}
      >
        <MenuOption onClick={() => handleHide(person)} icon={mdiEyeOffOutline} text={$t('hide_person')} />
        <MenuOption onClick={() => handleMerge(person.id)} icon={mdiAccountMultipleCheckOutline} text={$t('merge_people')} />
      </ButtonContextMenu>
    {/snippet}

    {#snippet footer()}
      {#if isEditor}
        <input
          type="text"
          class="mt-2 w-full rounded-2xl border-gray-100 bg-white py-2 text-center text-sm text-primary placeholder-gray-400 dark:border-gray-900 dark:bg-immich-dark-gray"
          value={person.name}
          placeholder={$t('add_a_name')}
          use:shortcut={{ shortcut: { key: 'Enter' }, onShortcut: (e) => e.currentTarget.blur() }}
          onfocusin={() => onNameFocus(person)}
          onfocusout={() => onNameSubmit(editingName, person)}
          oninput={(event) => onNameInput(event)}
        />
      {:else if managedPerson.displayName}
        <p class="mt-2 truncate text-center text-sm font-medium">{managedPerson.displayName}</p>
      {/if}
    {/snippet}
  </PersonTile>
</div>
```

Close the snippet/grid wrapper:

```svelte
    {/snippet}
  </PeopleGrid>
</div>
```

Remove the old page-local `hoveredPersonId`, `sentinel`, and `intersectionObserver` state once `PeopleGrid` owns loading.

- [ ] **Step 4: Delegate space visibility modal to `PeopleVisibilityModal`**

Replace `web/src/lib/components/spaces/manage-space-people-visibility.svelte` with this adapter:

```svelte
<script lang="ts">
  import PeopleVisibilityModal from '$lib/components/people/people-visibility-modal.svelte';
  import type { VisibilityChange, VisibilityPerson, VisibilitySaveResult } from '$lib/components/people/people-types';
  import { createUrl } from '$lib/utils';
  import { updateSpacePerson, type SharedSpacePersonResponseDto } from '@immich/sdk';

  interface Props {
    people: SharedSpacePersonResponseDto[];
    spaceId: string;
    onClose: () => void;
    onUpdate: (people: SharedSpacePersonResponseDto[]) => void;
    hasMore?: boolean;
    loading?: boolean;
    onLoadMore?: () => void;
  }

  let { people, spaceId, onClose, onUpdate, hasMore = false, loading = false, onLoadMore = () => {} }: Props = $props();

  const visibilityPeople: VisibilityPerson[] = $derived(
    people.map((person) => ({
      id: person.id,
      displayName: person.alias || person.name || '',
      thumbnailUrl: createUrl(`/shared-spaces/${spaceId}/people/${person.id}/thumbnail`, { updatedAt: person.updatedAt }),
      isHidden: person.isHidden,
    })),
  );

  const saveVisibilityChanges = async (changes: VisibilityChange[]): Promise<VisibilitySaveResult> => {
    const results = await Promise.allSettled(
      changes.map(({ id, isHidden }) =>
        updateSpacePerson({ id: spaceId, personId: id, sharedSpacePersonUpdateDto: { isHidden } }),
      ),
    );
    const successCount = results.filter((result) => result.status === 'fulfilled').length;
    return { successCount, failCount: results.length - successCount };
  };

  const handleUpdate = (updatedVisibilityPeople: VisibilityPerson[]) => {
    const hiddenById = new Map(updatedVisibilityPeople.map((person) => [person.id, person.isHidden]));
    onUpdate(people.map((person) => ({ ...person, isHidden: hiddenById.get(person.id) ?? person.isHidden })));
  };
</script>

<PeopleVisibilityModal
  people={visibilityPeople}
  {onClose}
  onUpdate={handleUpdate}
  gridClass="flex flex-wrap gap-1"
  personButtonClass="group relative"
  personStyle="width: 6rem; height: 6rem;"
  hasMore={hasMore}
  loading={loading}
  loadNextPage={onLoadMore}
  saveVisibilityChanges={saveVisibilityChanges}
/>
```

The space adapter must preserve the current compact space visibility layout with `flex flex-wrap gap-1` and fixed `6rem` person buttons. Do not change the shared modal's global defaults to accommodate the space layout.

- [ ] **Step 5: Run space adapter tests**

Run:

```bash
pnpm --dir web exec vitest run src/lib/components/spaces/space-people-page.spec.ts src/lib/components/spaces/manage-space-people-visibility.spec.ts
```

Expected: all space adapter tests pass.

- [ ] **Step 6: Commit space adapter migration**

Run:

```bash
git add 'web/src/routes/(user)/spaces/[spaceId]/people/+page.svelte' web/src/lib/components/spaces/space-people-page.spec.ts web/src/lib/components/spaces/manage-space-people-visibility.svelte web/src/lib/components/spaces/manage-space-people-visibility.spec.ts
git commit -m "feat: adapt space people to shared components"
```

---

### Task 5: Space Person Detail Alias And Birth Date

**Files:**

- Create: `web/src/lib/components/spaces/space-person-profile.svelte`
- Create: `web/src/lib/components/spaces/space-person-profile.spec.ts`
- Modify: `web/src/routes/(user)/spaces/[spaceId]/people/[personId]/+page.svelte`

- [ ] **Step 1: Add focused space detail profile tests**

Create `web/src/lib/components/spaces/space-person-profile.spec.ts`:

```ts
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { SharedSpaceRole, type SharedSpacePersonResponseDto } from '@immich/sdk';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import SpacePersonProfile from './space-person-profile.svelte';

vi.mock('@immich/ui', async (importOriginal) => {
  const original = await importOriginal<typeof import('@immich/ui')>();
  return {
    ...original,
    toastManager: { primary: vi.fn(), success: vi.fn(), warning: vi.fn() },
  };
});

const makePerson = (overrides: Partial<SharedSpacePersonResponseDto> = {}): SharedSpacePersonResponseDto =>
  ({
    id: 'p1',
    spaceId: 'space-1',
    name: 'Alice Johnson',
    alias: null,
    birthDate: null,
    assetCount: 3,
    faceCount: 4,
    isHidden: false,
    thumbnailPath: '/thumb.jpg',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    ...overrides,
  }) as SharedSpacePersonResponseDto;

function renderProfile({
  person = makePerson(),
  role = SharedSpaceRole.Editor,
  onPersonChange = vi.fn(),
}: {
  person?: SharedSpacePersonResponseDto;
  role?: SharedSpaceRole;
  onPersonChange?: (person: SharedSpacePersonResponseDto) => void;
} = {}) {
  return {
    onPersonChange,
    ...render(SpacePersonProfile, {
      props: {
        spaceId: 'space-1',
        person,
        canEditBirthDate: role === SharedSpaceRole.Owner || role === SharedSpaceRole.Editor,
        onPersonChange,
      },
    }),
  };
}

describe('SpacePersonProfile', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('displays alias as primary name and canonical name as secondary text', () => {
    renderProfile({ person: makePerson({ alias: 'Mom', name: 'Alice Johnson' }) });

    expect(screen.getByRole('heading', { name: 'Mom' })).toBeInTheDocument();
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
  });

  it('saves non-empty alias through setSpacePersonAlias', async () => {
    const { onPersonChange } = renderProfile({ person: makePerson({ alias: null }) });
    const user = userEvent.setup();

    await user.clear(screen.getByLabelText('spaces_set_alias'));
    await user.type(screen.getByLabelText('spaces_set_alias'), 'Mom');
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => {
      expect(sdkMock.setSpacePersonAlias).toHaveBeenCalledWith({
        id: 'space-1',
        personId: 'p1',
        sharedSpacePersonAliasDto: { alias: 'Mom' },
      });
      expect(onPersonChange).toHaveBeenCalledWith(expect.objectContaining({ alias: 'Mom' }));
    });
  });

  it('clears alias through deleteSpacePersonAlias', async () => {
    const { onPersonChange } = renderProfile({ person: makePerson({ alias: 'Mom' }) });

    await fireEvent.click(screen.getByRole('button', { name: 'clear' }));

    await waitFor(() => {
      expect(sdkMock.deleteSpacePersonAlias).toHaveBeenCalledWith({ id: 'space-1', personId: 'p1' });
      expect(onPersonChange).toHaveBeenCalledWith(expect.objectContaining({ alias: null }));
    });
  });

  it('allows viewers to save and clear their own alias', async () => {
    renderProfile({ person: makePerson({ alias: null }), role: SharedSpaceRole.Viewer });
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('spaces_set_alias'), 'Mom');
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => {
      expect(sdkMock.setSpacePersonAlias).toHaveBeenCalled();
    });
  });

  it('displays existing birth date using localized date formatting', () => {
    renderProfile({ person: makePerson({ birthDate: '1984-05-09' }) });

    expect(screen.getByText('person_birthdate')).toBeInTheDocument();
    expect(screen.getByText(/5\/9\/1984|09\/05\/1984|1984/)).toBeInTheDocument();
  });

  it('saves and clears birth date for editors', async () => {
    const { onPersonChange } = renderProfile({ person: makePerson({ birthDate: '1984-05-09' }) });
    sdkMock.updateSpacePerson.mockResolvedValue(makePerson({ birthDate: '1990-01-15' }));
    const user = userEvent.setup();

    await user.clear(screen.getByLabelText('set_date_of_birth'));
    await user.type(screen.getByLabelText('set_date_of_birth'), '1990-01-15');
    await user.click(screen.getByRole('button', { name: 'date_of_birth_saved' }));

    await waitFor(() => {
      expect(sdkMock.updateSpacePerson).toHaveBeenCalledWith({
        id: 'space-1',
        personId: 'p1',
        sharedSpacePersonUpdateDto: { birthDate: '1990-01-15' },
      });
      expect(onPersonChange).toHaveBeenCalledWith(expect.objectContaining({ birthDate: '1990-01-15' }));
    });

    await fireEvent.click(screen.getByRole('button', { name: 'clear' }));

    await waitFor(() => {
      expect(sdkMock.updateSpacePerson).toHaveBeenCalledWith({
        id: 'space-1',
        personId: 'p1',
        sharedSpacePersonUpdateDto: { birthDate: '' },
      });
    });
  });

  it('hides birth date editing for viewers', () => {
    renderProfile({ person: makePerson({ birthDate: '1984-05-09' }), role: SharedSpaceRole.Viewer });

    expect(screen.queryByLabelText('set_date_of_birth')).not.toBeInTheDocument();
    expect(screen.getByText('person_birthdate')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the space detail profile tests and verify missing component failure**

Run:

```bash
pnpm --dir web exec vitest run src/lib/components/spaces/space-person-profile.spec.ts
```

Expected: tests fail because `space-person-profile.svelte` does not exist.

- [ ] **Step 3: Create `SpacePersonProfile`**

Create `web/src/lib/components/spaces/space-person-profile.svelte`:

```svelte
<script lang="ts">
  import DateInput from '$lib/elements/DateInput.svelte';
  import { createUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import {
    deleteSpacePersonAlias,
    setSpacePersonAlias,
    updateSpacePerson,
    type SharedSpacePersonResponseDto,
  } from '@immich/sdk';
  import { Button, toastManager } from '@immich/ui';
  import { DateTime } from 'luxon';
  import { locale } from '$lib/stores/preferences.store';
  import { t } from 'svelte-i18n';

  interface Props {
    spaceId: string;
    person: SharedSpacePersonResponseDto;
    canEditBirthDate: boolean;
    onPersonChange: (person: SharedSpacePersonResponseDto) => void;
  }

  let { spaceId, person, canEditBirthDate, onPersonChange }: Props = $props();
  let alias = $state(person.alias ?? '');
  let birthDate = $state(person.birthDate ?? '');
  let savingAlias = $state(false);
  let savingBirthDate = $state(false);

  const displayName = $derived(person.alias || person.name || '');
  const todayFormatted = new Date().toISOString().split('T')[0];
  const thumbnailUrl = $derived(createUrl(`/shared-spaces/${spaceId}/people/${person.id}/thumbnail`, { updatedAt: person.updatedAt }));

  $effect(() => {
    person.id;
    alias = person.alias ?? '';
    birthDate = person.birthDate ?? '';
  });

  async function saveAlias() {
    const trimmedAlias = alias.trim();
    if (!trimmedAlias) {
      await clearAlias();
      return;
    }

    savingAlias = true;
    try {
      await setSpacePersonAlias({
        id: spaceId,
        personId: person.id,
        sharedSpacePersonAliasDto: { alias: trimmedAlias },
      });
      const updated = { ...person, alias: trimmedAlias };
      onPersonChange(updated);
      toastManager.primary($t('spaces_alias_saved'));
    } catch (error) {
      handleError(error, $t('spaces_error_saving_alias'));
    } finally {
      savingAlias = false;
    }
  }

  async function clearAlias() {
    savingAlias = true;
    try {
      await deleteSpacePersonAlias({ id: spaceId, personId: person.id });
      alias = '';
      const updated = { ...person, alias: null };
      onPersonChange(updated);
      toastManager.primary($t('spaces_alias_cleared'));
    } catch (error) {
      handleError(error, $t('spaces_error_saving_alias'));
    } finally {
      savingAlias = false;
    }
  }

  async function saveBirthDate() {
    savingBirthDate = true;
    try {
      const updated = await updateSpacePerson({
        id: spaceId,
        personId: person.id,
        sharedSpacePersonUpdateDto: { birthDate },
      });
      onPersonChange(updated);
      toastManager.primary($t('date_of_birth_saved'));
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_date_of_birth'));
    } finally {
      savingBirthDate = false;
    }
  }

  async function clearBirthDate() {
    birthDate = '';
    savingBirthDate = true;
    try {
      const updated = await updateSpacePerson({
        id: spaceId,
        personId: person.id,
        sharedSpacePersonUpdateDto: { birthDate: '' },
      });
      onPersonChange(updated);
      toastManager.primary($t('date_of_birth_saved'));
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_date_of_birth'));
    } finally {
      savingBirthDate = false;
    }
  }
</script>

<div class="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start">
  <div class="size-20 overflow-hidden rounded-full">
    <img src={thumbnailUrl} alt={displayName} class="size-full object-cover" />
  </div>

  <div class="flex min-w-0 flex-1 flex-col gap-3">
    <div>
      <h2 class="text-xl font-bold">{displayName}</h2>
      {#if person.alias && person.name}
        <p class="text-sm text-gray-500 dark:text-gray-400">{person.name}</p>
      {/if}
      <p class="text-sm text-gray-400 dark:text-gray-500">
        {person.assetCount}
        {$t('photos')}
      </p>
      {#if person.birthDate}
        <p class="text-sm text-gray-500 dark:text-gray-400">
          <span>{$t('person_birthdate')}</span>
          <span>
            {DateTime.fromISO(person.birthDate).toLocaleString(
              { month: 'numeric', day: 'numeric', year: 'numeric' },
              { locale: $locale },
            )}
          </span>
        </p>
      {/if}
    </div>

    <div class="flex flex-col gap-2 rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
      <label class="text-sm font-medium" for="space-person-alias">{$t('spaces_set_alias')}</label>
      <div class="flex flex-col gap-2 sm:flex-row">
        <input
          id="space-person-alias"
          class="immich-form-input flex-1"
          aria-label={$t('spaces_set_alias')}
          bind:value={alias}
          placeholder={$t('spaces_alias_placeholder')}
        />
        <Button size="small" onclick={saveAlias} loading={savingAlias}>{$t('save')}</Button>
        {#if person.alias}
          <Button size="small" color="secondary" onclick={clearAlias} disabled={savingAlias}>{$t('clear')}</Button>
        {/if}
      </div>
    </div>

    {#if canEditBirthDate}
      <div class="flex flex-col gap-2 rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
        <label class="text-sm font-medium" for="space-person-birth-date">{$t('set_date_of_birth')}</label>
        <div class="flex flex-col gap-2 sm:flex-row">
          <DateInput
            id="space-person-birth-date"
            class="immich-form-input flex-1"
            name="birthDate"
            type="date"
            aria-label={$t('set_date_of_birth')}
            bind:value={birthDate}
            max={todayFormatted}
          />
          <Button size="small" onclick={saveBirthDate} loading={savingBirthDate}>{$t('date_of_birth_saved')}</Button>
          {#if person.birthDate}
            <Button size="small" color="secondary" onclick={clearBirthDate} disabled={savingBirthDate}>{$t('clear')}</Button>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>
```

- [ ] **Step 4: Render `SpacePersonProfile` in the detail route**

In `web/src/routes/(user)/spaces/[spaceId]/people/[personId]/+page.svelte`, add:

```ts
import SpacePersonProfile from '$lib/components/spaces/space-person-profile.svelte';
```

Add this callback near `cancelMerge`:

```ts
function handlePersonChange(updatedPerson: SharedSpacePersonResponseDto) {
  person = updatedPerson;
}
```

Replace the non-merge detail header block:

```svelte
<div class="mb-4 flex items-center gap-4">
  <div class="size-20 overflow-hidden rounded-full">
    <img src={getThumbUrl(person)} alt={displayName} class="size-full object-cover" />
  </div>
  <div>
    <h2 class="text-xl font-bold">{displayName}</h2>
    {#if person.alias && person.name}
      <p class="text-sm text-gray-500 dark:text-gray-400">{person.name}</p>
    {/if}
    <p class="text-sm text-gray-400 dark:text-gray-500">
      {person.assetCount}
      {$t('photos')}
    </p>
  </div>
</div>
```

with:

```svelte
<SpacePersonProfile spaceId={space.id} {person} canEditBirthDate={isEditor} onPersonChange={handlePersonChange} />
```

Keep the asset-empty and asset-grid blocks unchanged.

- [ ] **Step 5: Run space detail profile tests**

Run:

```bash
pnpm --dir web exec vitest run src/lib/components/spaces/space-person-profile.spec.ts
```

Expected: all profile tests pass.

- [ ] **Step 6: Run the space people route tests**

Run:

```bash
pnpm --dir web exec vitest run src/lib/components/spaces/space-people-page.spec.ts src/lib/components/spaces/manage-space-people-visibility.spec.ts src/lib/components/spaces/space-person-profile.spec.ts
```

Expected: all space people tests pass.

- [ ] **Step 7: Commit space person detail capabilities**

Run:

```bash
git add web/src/lib/components/spaces/space-person-profile.svelte web/src/lib/components/spaces/space-person-profile.spec.ts 'web/src/routes/(user)/spaces/[spaceId]/people/[personId]/+page.svelte'
git commit -m "feat: expose space person alias and birth date"
```

---

### Task 6: Full Verification

**Files:**

- No source edits.

- [ ] **Step 1: Run targeted backend tests**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs run src/services/shared-space.service.spec.ts -t "updateSpacePerson|setSpacePersonAlias|deleteSpacePersonAlias"
pnpm --dir server exec vitest --config test/vitest.config.mjs run src/controllers/shared-space.controller.spec.ts
```

Expected: all targeted backend tests pass.

- [ ] **Step 2: Run targeted frontend tests**

Run:

```bash
pnpm --dir web exec vitest run src/lib/components/people/people-grid.spec.ts src/lib/components/people/person-tile.spec.ts src/lib/components/people/people-visibility-modal.spec.ts
pnpm --dir web exec vitest run 'src/routes/(user)/people/people-infinite-scroll.spec.ts' 'src/routes/(user)/people/people-card.spec.ts' 'src/routes/(user)/people/manage-people-visibility.spec.ts'
pnpm --dir web exec vitest run src/lib/components/spaces/space-people-page.spec.ts src/lib/components/spaces/manage-space-people-visibility.spec.ts src/lib/components/spaces/space-person-profile.spec.ts
```

Expected: all targeted frontend tests pass.

- [ ] **Step 3: Run type checks**

Run:

```bash
pnpm --dir server run check
pnpm --dir web run check:typescript
pnpm --dir web run check:svelte
```

Expected: all checks pass.

- [ ] **Step 4: Inspect changed files**

Run:

```bash
git status --short
git diff --stat main...
```

Expected: changes are limited to the planned files. If upstream branch name is not `main`, replace `main` with the fork’s upstream tracking branch.

- [ ] **Step 5: Final commit if verification produced fixes**

If verification required any follow-up edits, commit them:

```bash
git add <changed-files>
git commit -m "fix: stabilize shared people management"
```

Do not create a final empty commit if verification required no source edits.

---

## Self-Review Checklist

- Spec coverage: Tasks 2 through 4 implement shared grid/tile/visibility reuse for global and space people.
- Spec coverage: Task 4 keeps editor rename bound to canonical `name` while display labels use `alias || name`.
- Spec coverage: Task 5 exposes alias display/edit/clear and birth-date display/edit/clear on space person detail.
- Spec coverage: Task 5 allows alias editing for viewers and hides birth-date editing for viewers.
- Spec coverage: Task 1 adds backend regression coverage for shared-space birth-date update and empty-string clearing.
- Rebase constraints: existing route paths remain in place, new reusable files are additive, backend runtime/API and SDK files stay unchanged.
- Verification coverage: Task 6 includes targeted backend tests, targeted frontend tests, and server/web type checks.
