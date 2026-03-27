# Space People Visibility — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add "Show & Hide People" functionality to the space people page, matching the upstream `/people` page UX.

**Architecture:** Add `withHidden` query param to server endpoint so the modal can load all people (including hidden). Build a standalone `ManageSpacePeopleVisibility` Svelte component using space-specific APIs. Wire it into the space people page with a button + dialog pattern. Use `Promise.allSettled()` for batch saves.

**Tech Stack:** NestJS, Svelte 5, @immich/sdk, Vitest

---

### Task 1: Add `withHidden` query param to space people endpoint

**Files:**

- Modify: `server/src/dtos/shared-space-person.dto.ts:5-11`
- Modify: `server/src/services/shared-space.service.ts:608-619`
- Modify: `server/src/repositories/shared-space.repository.ts:489-499,502-511`
- Test: `server/src/services/shared-space.service.spec.ts`

**Step 1: Write failing test**

Add to the `getSpacePeople` describe block in `server/src/services/shared-space.service.spec.ts`:

```typescript
it('should include hidden persons when withHidden is true', async () => {
  const auth = factory.auth();
  const spaceId = newUuid();
  mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ spaceId }));
  mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
  mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);

  const hiddenPerson = {
    ...factory.sharedSpacePerson({ spaceId }),
    isHidden: true,
    personalName: 'Hidden Person',
    personalThumbnailPath: '/thumb.jpg',
  };
  mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([hiddenPerson]);
  mocks.sharedSpace.getPersonFaceCount.mockResolvedValue(3);
  mocks.sharedSpace.getPersonAssetCount.mockResolvedValue(5);

  const result = await sut.getSpacePeople(auth, spaceId, { withHidden: true });

  expect(result).toHaveLength(1);
});

it('should exclude hidden persons by default', async () => {
  const auth = factory.auth();
  const spaceId = newUuid();
  mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ spaceId }));
  mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
  mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);

  const hiddenPerson = {
    ...factory.sharedSpacePerson({ spaceId }),
    isHidden: true,
    personalName: 'Hidden Person',
    personalThumbnailPath: '/thumb.jpg',
  };
  mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([hiddenPerson]);

  const result = await sut.getSpacePeople(auth, spaceId);

  expect(result).toHaveLength(0);
});
```

**Step 2: Run tests to verify they fail**

Run: `cd server && npx vitest run src/services/shared-space.service.spec.ts --reporter=verbose 2>&1 | tail -30`
Expected: FAIL — `withHidden` not recognized on DTO, service still filters hidden.

**Step 3: Add `withHidden` to DTO**

In `server/src/dtos/shared-space-person.dto.ts`, add to `SpacePeopleQueryDto`:

```typescript
export class SpacePeopleQueryDto {
  @ValidateDate({ optional: true })
  takenAfter?: Date;

  @ValidateDate({ optional: true })
  takenBefore?: Date;

  @ValidateBoolean({ optional: true, description: 'Include hidden people' })
  withHidden?: boolean;
}
```

**Step 4: Update repository to conditionally filter**

In `server/src/repositories/shared-space.repository.ts`, update both query methods. Change line 497:

```typescript
  getPersonsBySpaceId(spaceId: string, withHidden = false) {
    return this.db
      .selectFrom('shared_space_person')
      .leftJoin('asset_face', 'asset_face.id', 'shared_space_person.representativeFaceId')
      .leftJoin('person', 'person.id', 'asset_face.personId')
      .selectAll('shared_space_person')
      .select(['person.name as personalName', 'person.thumbnailPath as personalThumbnailPath'])
      .where('shared_space_person.spaceId', '=', spaceId)
      .$if(!withHidden, (qb) => qb.where('shared_space_person.isHidden', '=', false))
      .orderBy('shared_space_person.name', 'asc')
      .execute();
  }
```

Same for `getPersonsBySpaceIdWithTemporalFilter` — add `withHidden = false` param and `.$if(!withHidden, ...)`.

Also update `@GenerateSql` decorators to include the new param: `@GenerateSql({ params: [DummyValue.UUID, false] })` for both methods.

**Step 5: Update service to pass `withHidden`**

In `server/src/services/shared-space.service.ts`, update `getSpacePeople` (lines 608-619):

```typescript
const withHidden = query?.withHidden ?? false;
const hasTemporal = query?.takenAfter || query?.takenBefore;
const persons = hasTemporal
  ? await this.sharedSpaceRepository.getPersonsBySpaceIdWithTemporalFilter(spaceId, query, withHidden)
  : await this.sharedSpaceRepository.getPersonsBySpaceId(spaceId, withHidden);
```

And update the service-level filter (line 617) to respect `withHidden`:

```typescript
if (!withHidden && person.isHidden) {
  continue;
}
```

**Step 6: Run tests**

Run: `cd server && npx vitest run src/services/shared-space.service.spec.ts --reporter=verbose 2>&1 | tail -30`
Expected: PASS

**Step 7: Commit**

```bash
git add server/src/dtos/shared-space-person.dto.ts server/src/repositories/shared-space.repository.ts server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "feat: add withHidden query param to space people endpoint"
```

---

### Task 2: Create `ManageSpacePeopleVisibility` component

**Files:**

- Create: `web/src/lib/components/spaces/manage-space-people-visibility.svelte`
- Create: `web/src/lib/components/spaces/manage-space-people-visibility.spec.ts`

**Step 1: Write failing test**

Create `web/src/lib/components/spaces/manage-space-people-visibility.spec.ts`:

```typescript
import ManageSpacePeopleVisibility from '$lib/components/spaces/manage-space-people-visibility.svelte';
import { updateSpacePerson } from '@immich/sdk';
import { fireEvent, render, screen } from '@testing-library/svelte';

vi.mock('@immich/sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@immich/sdk')>();
  return { ...actual, updateSpacePerson: vi.fn() };
});

const makePerson = (overrides: Record<string, unknown> = {}) => ({
  id: 'person-1',
  spaceId: 'space-1',
  name: 'Alice',
  alias: null,
  thumbnailPath: '/thumb.jpg',
  assetCount: 5,
  faceCount: 3,
  isHidden: false,
  representativeFaceId: 'face-1',
  birthDate: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('ManageSpacePeopleVisibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all people including hidden ones', () => {
    const people = [
      makePerson({ id: 'p1', name: 'Alice', isHidden: false }),
      makePerson({ id: 'p2', name: 'Bob', isHidden: true }),
    ];
    render(ManageSpacePeopleVisibility, { people, spaceId: 'space-1', onClose: vi.fn(), onUpdate: vi.fn() });

    expect(screen.getByTestId('visibility-person-p1')).toBeInTheDocument();
    expect(screen.getByTestId('visibility-person-p2')).toBeInTheDocument();
  });

  it('should show hidden people with aria-pressed true', () => {
    const people = [makePerson({ id: 'p1', isHidden: true })];
    render(ManageSpacePeopleVisibility, { people, spaceId: 'space-1', onClose: vi.fn(), onUpdate: vi.fn() });

    expect(screen.getByTestId('visibility-person-p1')).toHaveAttribute('aria-pressed', 'true');
  });

  it('should toggle hidden state on click', async () => {
    const people = [makePerson({ id: 'p1', isHidden: false })];
    render(ManageSpacePeopleVisibility, { people, spaceId: 'space-1', onClose: vi.fn(), onUpdate: vi.fn() });

    const btn = screen.getByTestId('visibility-person-p1');
    expect(btn).toHaveAttribute('aria-pressed', 'false');

    await fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('should call updateSpacePerson for each changed person on save', async () => {
    vi.mocked(updateSpacePerson).mockResolvedValue({} as any);
    const onClose = vi.fn();
    const onUpdate = vi.fn();
    const people = [makePerson({ id: 'p1', isHidden: false }), makePerson({ id: 'p2', isHidden: false })];
    render(ManageSpacePeopleVisibility, { people, spaceId: 'space-1', onClose, onUpdate });

    // Toggle p1 to hidden
    await fireEvent.click(screen.getByTestId('visibility-person-p1'));
    // Click done
    await fireEvent.click(screen.getByTestId('save-visibility'));

    expect(updateSpacePerson).toHaveBeenCalledWith({
      id: 'space-1',
      personId: 'p1',
      sharedSpacePersonUpdateDto: { isHidden: true },
    });
    expect(updateSpacePerson).toHaveBeenCalledTimes(1); // only changed person
  });

  it('should call onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(ManageSpacePeopleVisibility, { people: [], spaceId: 'space-1', onClose, onUpdate: vi.fn() });

    await fireEvent.click(screen.getByTestId('close-visibility'));
    expect(onClose).toHaveBeenCalled();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd web && npx vitest run src/lib/components/spaces/manage-space-people-visibility.spec.ts --reporter=verbose 2>&1 | tail -20`
Expected: FAIL — component doesn't exist yet.

**Step 3: Create the component**

Create `web/src/lib/components/spaces/manage-space-people-visibility.svelte`:

```svelte
<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import { ToggleVisibility } from '$lib/constants';
  import { createUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { updateSpacePerson, type SharedSpacePersonResponseDto } from '@immich/sdk';
  import { Button, IconButton, toastManager } from '@immich/ui';
  import { mdiClose, mdiEye, mdiEyeOff, mdiEyeSettings, mdiRestart } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { SvelteMap } from 'svelte/reactivity';

  interface Props {
    people: SharedSpacePersonResponseDto[];
    spaceId: string;
    onClose: () => void;
    onUpdate: (people: SharedSpacePersonResponseDto[]) => void;
  }

  let { people, spaceId, onClose, onUpdate }: Props = $props();

  let toggleVisibility = $state(ToggleVisibility.SHOW_ALL);
  let showLoadingSpinner = $state(false);
  const overrides = new SvelteMap<string, boolean>();

  const getNextVisibility = (current: ToggleVisibility) => {
    if (current === ToggleVisibility.SHOW_ALL) {
      return ToggleVisibility.HIDE_UNNANEMD;
    } else if (current === ToggleVisibility.HIDE_UNNANEMD) {
      return ToggleVisibility.HIDE_ALL;
    }
    return ToggleVisibility.SHOW_ALL;
  };

  const handleToggleVisibility = () => {
    toggleVisibility = getNextVisibility(toggleVisibility);
    for (const person of people) {
      let isHidden = overrides.get(person.id) ?? person.isHidden;
      if (toggleVisibility === ToggleVisibility.HIDE_ALL) {
        isHidden = true;
      } else if (toggleVisibility === ToggleVisibility.SHOW_ALL) {
        isHidden = false;
      } else if (toggleVisibility === ToggleVisibility.HIDE_UNNANEMD && !person.name) {
        isHidden = true;
      }
      setHiddenOverride(person, isHidden);
    }
  };

  const handleSave = async () => {
    showLoadingSpinner = true;
    const changed = Array.from(overrides, ([id, isHidden]) => ({ id, isHidden }));

    try {
      if (changed.length > 0) {
        const results = await Promise.allSettled(
          changed.map(({ id, isHidden }) =>
            updateSpacePerson({ id: spaceId, personId: id, sharedSpacePersonUpdateDto: { isHidden } }),
          ),
        );
        const successCount = results.filter((r) => r.status === 'fulfilled').length;
        const failCount = results.length - successCount;
        if (failCount > 0) {
          toastManager.warning($t('errors.unable_to_change_visibility', { values: { count: failCount } }));
        }
        toastManager.primary($t('visibility_changed', { values: { count: successCount } }));
      }

      for (const person of people) {
        const isHidden = overrides.get(person.id);
        if (isHidden !== undefined) {
          person.isHidden = isHidden;
        }
      }
      overrides.clear();
      onUpdate(people);
      onClose();
    } catch (error) {
      handleError(error, $t('errors.unable_to_change_visibility', { values: { count: changed.length } }));
    } finally {
      showLoadingSpinner = false;
    }
  };

  const setHiddenOverride = (person: SharedSpacePersonResponseDto, isHidden: boolean) => {
    if (isHidden === person.isHidden) {
      overrides.delete(person.id);
      return;
    }
    overrides.set(person.id, isHidden);
  };

  const getThumbUrl = (person: SharedSpacePersonResponseDto): string => {
    return createUrl(`/shared-spaces/${spaceId}/people/${person.id}/thumbnail`, { updatedAt: person.updatedAt });
  };

  let toggleButtonOptions: Record<ToggleVisibility, { icon: string; label: string }> = $derived({
    [ToggleVisibility.HIDE_ALL]: { icon: mdiEyeOff, label: $t('hide_all_people') },
    [ToggleVisibility.HIDE_UNNANEMD]: { icon: mdiEyeSettings, label: $t('hide_unnamed_people') },
    [ToggleVisibility.SHOW_ALL]: { icon: mdiEye, label: $t('show_all_people') },
  });
  let toggleButton = $derived(toggleButtonOptions[getNextVisibility(toggleVisibility)]);
</script>

<svelte:document use:shortcut={{ shortcut: { key: 'Escape' }, onShortcut: onClose }} />

<div class="h-full overflow-y-auto">
  <div
    class="sticky top-0 z-1 flex h-16 w-full items-center justify-between border-b bg-white p-1 dark:border-immich-dark-gray dark:bg-black dark:text-immich-dark-fg md:p-8"
  >
    <div class="flex items-center">
      <IconButton
        shape="round"
        color="secondary"
        variant="ghost"
        aria-label={$t('close')}
        icon={mdiClose}
        onclick={onClose}
        data-testid="close-visibility"
      />
      <p class="ms-2">{$t('show_and_hide_people')}</p>
    </div>
    <div class="flex items-center justify-end">
      <div class="flex items-center md:me-4">
        <IconButton
          shape="round"
          color="secondary"
          variant="ghost"
          aria-label={$t('reset_people_visibility')}
          icon={mdiRestart}
          onclick={() => overrides.clear()}
        />
        <IconButton
          shape="round"
          color="secondary"
          variant="ghost"
          aria-label={toggleButton.label}
          icon={toggleButton.icon}
          onclick={handleToggleVisibility}
        />
      </div>
      <Button loading={showLoadingSpinner} onclick={handleSave} size="small" data-testid="save-visibility"
        >{$t('done')}</Button
      >
    </div>
  </div>

  <div class="flex flex-wrap gap-1 p-2 pb-8 md:px-8">
    {#each people as person (person.id)}
      {@const hidden = overrides.get(person.id) ?? person.isHidden}
      <button
        type="button"
        class="group relative"
        style="width: 6rem; height: 6rem;"
        onclick={() => setHiddenOverride(person, !hidden)}
        aria-pressed={hidden}
        data-testid="visibility-person-{person.id}"
      >
        <ImageThumbnail
          {hidden}
          shadow
          url={getThumbUrl(person)}
          altText={person.name || ''}
          widthStyle="100%"
          hiddenIconClass="text-white group-hover:text-black transition-colors"
          preload={false}
        />
        {#if person.name}
          <span class="absolute bottom-2 start-0 w-full select-text px-1 text-center text-xs font-medium text-white">
            {person.name}
          </span>
        {/if}
      </button>
    {/each}
  </div>
</div>
```

**Step 4: Run tests**

Run: `cd web && npx vitest run src/lib/components/spaces/manage-space-people-visibility.spec.ts --reporter=verbose 2>&1 | tail -20`
Expected: PASS

**Step 5: Commit**

```bash
git add web/src/lib/components/spaces/manage-space-people-visibility.svelte web/src/lib/components/spaces/manage-space-people-visibility.spec.ts
git commit -m "feat: add ManageSpacePeopleVisibility component"
```

---

### Task 3: Wire visibility modal into space people page

**Files:**

- Modify: `web/src/routes/(user)/spaces/[spaceId]/people/+page.svelte`

**Step 1: Update the space people page**

Add imports, `selectHidden` state, button, dialog, and visible-people filtering.

In the script section, add:

```typescript
import ManageSpacePeopleVisibility from '$lib/components/spaces/manage-space-people-visibility.svelte';
import { fly } from 'svelte/transition';
import { quintOut } from 'svelte/easing';
import { mdiEyeOutline } from '@mdi/js';
import { Button } from '@immich/ui';
```

Note: `{@attach ...}` is a Svelte 5 template directive — no import needed.

Add state:

```typescript
let selectHidden = $state(false);
const visiblePeople = $derived(people.filter((p) => !p.isHidden));
```

Add a function to load all people (including hidden) for the modal:

```typescript
let allPeople = $state<SharedSpacePersonResponseDto[]>([]);

async function openVisibilityModal() {
  try {
    allPeople = await getSpacePeople({ id: space.id, withHidden: true });
  } catch (error) {
    handleError(error, $t('spaces_error_loading_people'));
    return;
  }
  selectHidden = true;
}
```

Add the button after the back arrow (inside `{#snippet leading()}`), only for editors:

```svelte
{#if isEditor}
  <Button
    leadingIcon={mdiEyeOutline}
    onclick={openVisibilityModal}
    size="small"
    variant="ghost"
    color="secondary">{$t('show_and_hide_people')}</Button>
{/if}
```

Replace `people` with `visiblePeople` in the grid rendering (`{#each people as person}` → `{#each visiblePeople as person}`), and in the empty state check (`people.length === 0` → `visiblePeople.length === 0`).

Add the dialog after `</UserPageLayout>`:

```svelte
{#if selectHidden}
  <dialog
    transition:fly={{ y: 500, duration: 150, easing: quintOut, opacity: 0 }}
    class="fixed inset-0 h-full w-full max-w-none max-h-none bg-light"
    aria-labelledby="manage-visibility-title"
    {@attach (dialog) => dialog.showModal()}
  >
    <ManageSpacePeopleVisibility
      people={allPeople}
      spaceId={space.id}
      onClose={() => (selectHidden = false)}
      onUpdate={() => refreshPeople()}
    />
  </dialog>
{/if}
```

**Step 2: Run web tests**

Run: `cd web && npx vitest run --reporter=verbose 2>&1 | tail -10`
Expected: PASS

**Step 3: Commit**

```bash
git add web/src/routes/\(user\)/spaces/\[spaceId\]/people/+page.svelte
git commit -m "feat: add Show & Hide People to space people page"
```

---

### Task 4: Sort people — named first, then unnamed, both by frequency

**Files:**

- Modify: `web/src/routes/(user)/spaces/[spaceId]/people/+page.svelte`
- Modify: `web/src/lib/components/spaces/space-people-strip.svelte`
- Test: `web/src/lib/components/spaces/space-people-strip.spec.ts`

People should be grouped: named people first, unnamed people second. Within each group, sort by `assetCount` descending (most frequent first). This applies to both the people page grid and the strip under the cover photo.

**Step 1: Write failing test for strip sorting**

Add to `web/src/lib/components/spaces/space-people-strip.spec.ts`:

```typescript
it('should display named people before unnamed, each sorted by assetCount', () => {
  const people = [
    makePerson({ id: 'unnamed-many', name: '', assetCount: 100 }),
    makePerson({ id: 'named-few', name: 'Alice', assetCount: 2 }),
    makePerson({ id: 'named-many', name: 'Bob', assetCount: 50 }),
    makePerson({ id: 'unnamed-few', name: '', assetCount: 5 }),
  ];
  render(SpacePeopleStrip, { people, spaceId: 'space-1' });

  const buttons = screen.getAllByTestId(/^person-thumb-/);
  // Named first (Bob 50, Alice 2), then unnamed are filtered out by namedPeople
  expect(buttons[0]).toHaveAttribute('data-testid', 'person-thumb-named-many');
  expect(buttons[1]).toHaveAttribute('data-testid', 'person-thumb-named-few');
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run src/lib/components/spaces/space-people-strip.spec.ts --reporter=verbose 2>&1 | tail -20`

**Step 3: Update strip component sorting**

In `web/src/lib/components/spaces/space-people-strip.svelte`, update the `namedPeople` derived:

```typescript
const namedPeople = $derived(
  people.filter((p) => !p.isHidden && (p.alias || p.name)).toSorted((a, b) => b.assetCount - a.assetCount),
);
```

**Step 4: Update space people page sorting**

In `web/src/routes/(user)/spaces/[spaceId]/people/+page.svelte`, update `visiblePeople`:

```typescript
const visiblePeople = $derived(
  people
    .filter((p) => !p.isHidden)
    .toSorted((a, b) => {
      const aHasName = a.name ? 0 : 1;
      const bHasName = b.name ? 0 : 1;
      if (aHasName !== bHasName) {
        return aHasName - bHasName;
      }
      return b.assetCount - a.assetCount;
    }),
);
```

**Step 5: Run tests**

Run: `cd web && npx vitest run src/lib/components/spaces/space-people-strip.spec.ts --reporter=verbose 2>&1 | tail -20`
Expected: PASS

**Step 6: Commit**

```bash
git add web/src/lib/components/spaces/space-people-strip.svelte web/src/lib/components/spaces/space-people-strip.spec.ts web/src/routes/\(user\)/spaces/\[spaceId\]/people/+page.svelte
git commit -m "feat: sort space people — named first, then unnamed, by frequency"
```

---

### Task 5: Regenerate SDK and SQL, lint, final verification

**Step 1: Build server and regenerate**

Run: `cd server && pnpm build && pnpm sync:open-api`
Then: `make open-api` and `make sql`

**Step 2: Lint and typecheck**

Run: `make lint-server` then `make check-server`
Run: `make lint-web` then `make check-web`

**Step 3: Run all tests**

Run: `cd server && pnpm test -- --run`
Run: `cd web && pnpm test -- --run`

**Step 4: Commit generated files**

```bash
git add open-api/ server/src/queries/ mobile/
git commit -m "chore: regenerate OpenAPI clients and SQL for withHidden param"
```
