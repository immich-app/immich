# Persistent Onboarding Banner Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the disappearing empty state checklist with a persistent progress banner that guides space owners through 3 setup steps until all are complete.

**Architecture:** Remove thumbnail auto-assignment from `addAssets()`. Create a new `SpaceOnboardingBanner` Svelte component that derives completion from existing `SharedSpaceResponseDto` fields (`assetCount`, `memberCount`, `thumbnailAssetId`). Integrate it into the space detail page between the hero and timeline. The banner is owner-only, has expanded/collapsed states, and auto-hides when all 3 steps are done.

**Tech Stack:** NestJS (server), Svelte 5 with runes (web), Vitest (unit tests), Playwright (E2E tests), Tailwind CSS 4, `@immich/ui`

---

## Task 1: Remove Thumbnail Auto-Assignment — Write Failing Test

**Files:**

- Modify: `server/src/services/shared-space.service.spec.ts`

**Step 1: Update existing test to verify NO auto-assignment**

Replace the test at line 991 (`should auto-set thumbnailAssetId when space has no thumbnail`) with a test that verifies the opposite behavior:

```typescript
it('should NOT auto-set thumbnailAssetId when space has no thumbnail', async () => {
  const auth = factory.auth();
  const spaceId = newUuid();
  const assetId1 = newUuid();
  const editorMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Editor });
  const space = factory.sharedSpace({ id: spaceId, thumbnailAssetId: null });

  mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
  mocks.sharedSpace.addAssets.mockResolvedValue([]);
  mocks.sharedSpace.getById.mockResolvedValue(space);
  mocks.sharedSpace.update.mockResolvedValue(space);

  await sut.addAssets(auth, spaceId, { assetIds: [assetId1] });

  expect(mocks.sharedSpace.update).toHaveBeenCalledWith(spaceId, {
    lastActivityAt: expect.any(Date),
  });
});
```

**Step 2: Run tests to verify it fails**

Run: `cd server && pnpm test -- --run src/services/shared-space.service.spec.ts`
Expected: FAIL — the test expects `update` to be called with only `lastActivityAt`, but the current code also passes `thumbnailAssetId`.

---

## Task 2: Remove Thumbnail Auto-Assignment — Implement

**Files:**

- Modify: `server/src/services/shared-space.service.ts:242-254`

**Step 1: Simplify `addAssets` to remove auto-assignment**

Replace the current `addAssets` method:

```typescript
async addAssets(auth: AuthDto, spaceId: string, dto: SharedSpaceAssetAddDto): Promise<void> {
  await this.requireRole(auth, spaceId, SharedSpaceRole.Editor);
  await this.sharedSpaceRepository.addAssets(
    dto.assetIds.map((assetId) => ({ spaceId, assetId, addedById: auth.user.id })),
  );

  await this.sharedSpaceRepository.update(spaceId, { lastActivityAt: new Date() });
}
```

Note: The `getById` call is no longer needed since we're not checking `thumbnailAssetId`.

**Step 2: Run tests to verify they pass**

Run: `cd server && pnpm test -- --run src/services/shared-space.service.spec.ts`
Expected: PASS

**Step 3: Also remove test `should not change thumbnailAssetId when space already has one` (line 1011)**

This test is no longer meaningful since we never touch `thumbnailAssetId` in `addAssets`.

**Step 4: Update test `should add assets when editor` (line 970)**

Remove `mocks.sharedSpace.getById.mockResolvedValue(space)` — it's no longer called. The test should only mock `getMember`, `addAssets`, and `update`.

```typescript
it('should add assets when editor', async () => {
  const auth = factory.auth();
  const spaceId = newUuid();
  const assetId1 = newUuid();
  const assetId2 = newUuid();
  const editorMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Editor });

  mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
  mocks.sharedSpace.addAssets.mockResolvedValue([]);
  mocks.sharedSpace.update.mockResolvedValue(factory.sharedSpace({ id: spaceId }));

  await sut.addAssets(auth, spaceId, { assetIds: [assetId1, assetId2] });

  expect(mocks.sharedSpace.addAssets).toHaveBeenCalledWith([
    { spaceId, assetId: assetId1, addedById: auth.user.id },
    { spaceId, assetId: assetId2, addedById: auth.user.id },
  ]);
});
```

**Step 5: Update test `should update lastActivityAt when adding assets` (line 1028)**

Remove `mocks.sharedSpace.getById` mock:

```typescript
it('should update lastActivityAt when adding assets', async () => {
  const auth = factory.auth();
  const spaceId = newUuid();
  const assetId = newUuid();
  const editorMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Editor });

  mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
  mocks.sharedSpace.addAssets.mockResolvedValue([]);
  mocks.sharedSpace.update.mockResolvedValue(factory.sharedSpace({ id: spaceId }));

  await sut.addAssets(auth, spaceId, { assetIds: [assetId] });

  expect(mocks.sharedSpace.update).toHaveBeenCalledWith(spaceId, {
    lastActivityAt: expect.any(Date),
  });
});
```

**Step 6: Run all server tests**

Run: `cd server && pnpm test -- --run src/services/shared-space.service.spec.ts`
Expected: ALL PASS

**Step 7: Commit**

```bash
git add server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "fix(server): remove auto-assign thumbnail from addAssets

Covers must now be explicitly set via 'Set as space cover' menu action.
This supports the persistent onboarding banner where step 3 (set cover)
should not auto-complete when photos are added."
```

---

## Task 3: Add i18n Keys

**Files:**

- Modify: `i18n/en.json`

**Step 1: Add onboarding banner translation keys**

Add these keys in alphabetical order within the file:

```json
"spaces_onboarding_add_photos": "Add photos from your timeline",
"spaces_onboarding_add_photos_description": "Share your favorite moments with the group",
"spaces_onboarding_invite_members": "Invite members to collaborate",
"spaces_onboarding_invite_members_description": "Bring others into your shared space",
"spaces_onboarding_set_cover": "Set a cover photo",
"spaces_onboarding_set_cover_description": "Personalize your space with a cover image",
"spaces_onboarding_title": "Get started with your space",
"spaces_setup_steps_done": "{completed} of {total} setup steps done"
```

**Step 2: Run i18n sort**

Run: `pnpm --filter=immich-i18n format:fix`

**Step 3: Commit**

```bash
git add i18n/en.json
git commit -m "feat(i18n): add onboarding banner translation keys"
```

---

## Task 4: Create Onboarding Banner Component — Write Unit Tests

**Files:**

- Create: `web/src/lib/components/spaces/space-onboarding-banner.spec.ts`

**Step 1: Write comprehensive unit tests**

```typescript
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import SpaceOnboardingBanner from '$lib/components/spaces/space-onboarding-banner.svelte';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { type SharedSpaceResponseDto } from '@immich/sdk';

vi.mock('$lib/utils/i18n', () => ({
  locale: { subscribe: vi.fn() },
  t: (key: string) => ({
    subscribe: (fn: (v: string) => void) => {
      fn(key);
      return { unsubscribe: vi.fn() };
    },
  }),
  getPreferredLocale: () => 'en',
}));

const makeSpace = (overrides: Partial<SharedSpaceResponseDto> = {}): SharedSpaceResponseDto => ({
  id: 'space-1',
  name: 'Test Space',
  createdById: 'user-1',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  assetCount: 0,
  memberCount: 1,
  thumbnailAssetId: null,
  ...overrides,
});

describe('SpaceOnboardingBanner', () => {
  // Visibility
  it('should render banner when no steps are complete', () => {
    render(SpaceOnboardingBanner, {
      props: { space: makeSpace(), onAddPhotos: vi.fn(), onInviteMembers: vi.fn() },
    });
    expect(screen.getByTestId('onboarding-banner')).toBeInTheDocument();
  });

  it('should not render when all steps are complete', () => {
    render(SpaceOnboardingBanner, {
      props: {
        space: makeSpace({ assetCount: 5, memberCount: 3, thumbnailAssetId: 'thumb-1' }),
        onAddPhotos: vi.fn(),
        onInviteMembers: vi.fn(),
      },
    });
    expect(screen.queryByTestId('onboarding-banner')).not.toBeInTheDocument();
  });

  // Progress tracking
  it('should show 0 of 3 when no steps done', () => {
    render(SpaceOnboardingBanner, {
      props: { space: makeSpace(), onAddPhotos: vi.fn(), onInviteMembers: vi.fn() },
    });
    expect(screen.getByTestId('progress-text')).toHaveTextContent('0');
    expect(screen.getByTestId('progress-text')).toHaveTextContent('3');
  });

  it('should show 1 of 3 when only photos added', () => {
    render(SpaceOnboardingBanner, {
      props: { space: makeSpace({ assetCount: 5 }), onAddPhotos: vi.fn(), onInviteMembers: vi.fn() },
    });
    expect(screen.getByTestId('progress-text')).toHaveTextContent('1');
  });

  it('should show 2 of 3 when photos and members done', () => {
    render(SpaceOnboardingBanner, {
      props: { space: makeSpace({ assetCount: 5, memberCount: 2 }), onAddPhotos: vi.fn(), onInviteMembers: vi.fn() },
    });
    expect(screen.getByTestId('progress-text')).toHaveTextContent('2');
  });

  // Step completion indicators
  it('should mark add-photos step as complete when assetCount > 0', () => {
    render(SpaceOnboardingBanner, {
      props: { space: makeSpace({ assetCount: 3 }), onAddPhotos: vi.fn(), onInviteMembers: vi.fn() },
    });
    expect(screen.getByTestId('step-add-photos-check')).toBeInTheDocument();
  });

  it('should mark invite-members step as complete when memberCount > 1', () => {
    render(SpaceOnboardingBanner, {
      props: { space: makeSpace({ memberCount: 2 }), onAddPhotos: vi.fn(), onInviteMembers: vi.fn() },
    });
    expect(screen.getByTestId('step-invite-members-check')).toBeInTheDocument();
  });

  it('should mark set-cover step as complete when thumbnailAssetId set', () => {
    render(SpaceOnboardingBanner, {
      props: { space: makeSpace({ thumbnailAssetId: 'thumb-1' }), onAddPhotos: vi.fn(), onInviteMembers: vi.fn() },
    });
    expect(screen.getByTestId('step-set-cover-check')).toBeInTheDocument();
  });

  // Action buttons
  it('should call onAddPhotos when add photos button clicked', async () => {
    const onAddPhotos = vi.fn();
    render(SpaceOnboardingBanner, {
      props: { space: makeSpace(), onAddPhotos, onInviteMembers: vi.fn() },
    });
    await fireEvent.click(screen.getByTestId('step-add-photos-action'));
    expect(onAddPhotos).toHaveBeenCalled();
  });

  it('should call onInviteMembers when invite button clicked', async () => {
    const onInviteMembers = vi.fn();
    render(SpaceOnboardingBanner, {
      props: { space: makeSpace(), onAddPhotos: vi.fn(), onInviteMembers },
    });
    await fireEvent.click(screen.getByTestId('step-invite-members-action'));
    expect(onInviteMembers).toHaveBeenCalled();
  });

  it('should not show action button for completed steps', () => {
    render(SpaceOnboardingBanner, {
      props: { space: makeSpace({ assetCount: 5 }), onAddPhotos: vi.fn(), onInviteMembers: vi.fn() },
    });
    expect(screen.queryByTestId('step-add-photos-action')).not.toBeInTheDocument();
  });

  // Collapse behavior
  it('should collapse when chevron clicked', async () => {
    render(SpaceOnboardingBanner, {
      props: { space: makeSpace(), onAddPhotos: vi.fn(), onInviteMembers: vi.fn() },
    });
    await fireEvent.click(screen.getByTestId('banner-collapse-toggle'));
    expect(screen.getByTestId('onboarding-banner')).toHaveAttribute('data-collapsed', 'true');
  });

  it('should expand when collapsed chevron clicked', async () => {
    render(SpaceOnboardingBanner, {
      props: { space: makeSpace(), onAddPhotos: vi.fn(), onInviteMembers: vi.fn() },
    });
    await fireEvent.click(screen.getByTestId('banner-collapse-toggle'));
    await fireEvent.click(screen.getByTestId('banner-collapse-toggle'));
    expect(screen.getByTestId('onboarding-banner')).toHaveAttribute('data-collapsed', 'false');
  });

  // Progress bar width
  it('should set progress bar width to 0% when no steps done', () => {
    render(SpaceOnboardingBanner, {
      props: { space: makeSpace(), onAddPhotos: vi.fn(), onInviteMembers: vi.fn() },
    });
    const bar = screen.getByTestId('progress-bar-fill');
    expect(bar.style.width).toBe('0%');
  });

  it('should set progress bar width to 66% when 2 steps done', () => {
    render(SpaceOnboardingBanner, {
      props: { space: makeSpace({ assetCount: 5, memberCount: 2 }), onAddPhotos: vi.fn(), onInviteMembers: vi.fn() },
    });
    const bar = screen.getByTestId('progress-bar-fill');
    expect(bar.style.width).toBe('66%');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd web && pnpm test -- --run src/lib/components/spaces/space-onboarding-banner.spec.ts`
Expected: FAIL — component doesn't exist yet.

---

## Task 5: Create Onboarding Banner Component — Implement

**Files:**

- Create: `web/src/lib/components/spaces/space-onboarding-banner.svelte`

**Step 1: Implement the component**

```svelte
<script lang="ts">
  import type { SharedSpaceResponseDto } from '@immich/sdk';
  import { IconButton } from '@immich/ui';
  import { mdiCheck, mdiChevronDown, mdiChevronUp, mdiImageFilterHdrOutline, mdiImagePlusOutline, mdiAccountPlusOutline } from '@mdi/js';
  import Icon from '$lib/components/elements/icon.svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    space: SharedSpaceResponseDto;
    gradientClass?: string;
    onAddPhotos: () => void;
    onInviteMembers: () => void;
  }

  let { space, gradientClass = '', onAddPhotos, onInviteMembers }: Props = $props();

  let collapsed = $state(false);

  const hasPhotos = $derived((space.assetCount ?? 0) > 0);
  const hasMembers = $derived((space.memberCount ?? 0) > 1);
  const hasCover = $derived(space.thumbnailAssetId !== null && space.thumbnailAssetId !== undefined);

  const completedCount = $derived((hasPhotos ? 1 : 0) + (hasMembers ? 1 : 0) + (hasCover ? 1 : 0));
  const allComplete = $derived(completedCount === 3);
  const progressPercent = $derived(Math.round((completedCount / 3) * 100));

  const steps = $derived([
    {
      id: 'add-photos',
      icon: mdiImagePlusOutline,
      label: $t('spaces_onboarding_add_photos'),
      description: $t('spaces_onboarding_add_photos_description'),
      complete: hasPhotos,
      action: onAddPhotos,
    },
    {
      id: 'invite-members',
      icon: mdiAccountPlusOutline,
      label: $t('spaces_onboarding_invite_members'),
      description: $t('spaces_onboarding_invite_members_description'),
      complete: hasMembers,
      action: onInviteMembers,
    },
    {
      id: 'set-cover',
      icon: mdiImageFilterHdrOutline,
      label: $t('spaces_onboarding_set_cover'),
      description: $t('spaces_onboarding_set_cover_description'),
      complete: hasCover,
      action: undefined,
    },
  ]);
</script>

{#if !allComplete}
  <div
    class="mx-4 mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm
      dark:border-gray-700 dark:bg-immich-dark-gray"
    data-testid="onboarding-banner"
    data-collapsed={collapsed}
  >
    <!-- Progress bar -->
    <div class="h-1 w-full bg-gray-100 dark:bg-gray-800">
      <div
        class="h-full bg-gradient-to-r transition-all duration-500 ease-out {gradientClass}"
        style="width: {progressPercent}%"
        data-testid="progress-bar-fill"
      ></div>
    </div>

    <!-- Header (always visible) -->
    <div class="flex items-center justify-between px-4 py-2.5">
      <p class="text-sm font-medium text-gray-600 dark:text-gray-300" data-testid="progress-text">
        {$t('spaces_setup_steps_done', { values: { completed: completedCount, total: 3 } })}
      </p>
      <button
        class="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600
          dark:hover:bg-gray-700 dark:hover:text-gray-200"
        onclick={() => (collapsed = !collapsed)}
        data-testid="banner-collapse-toggle"
        aria-label={collapsed ? 'Expand' : 'Collapse'}
      >
        <Icon path={collapsed ? mdiChevronDown : mdiChevronUp} size="20" />
      </button>
    </div>

    <!-- Steps (collapsible) -->
    {#if !collapsed}
      <div class="grid gap-1 px-4 pb-4 sm:grid-cols-3">
        {#each steps as step (step.id)}
          <div
            class="flex items-start gap-3 rounded-lg p-3 {step.complete
              ? 'bg-gray-50 dark:bg-gray-800/30'
              : 'bg-white dark:bg-transparent'}"
          >
            <!-- Step icon circle -->
            <div
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full
                {step.complete
                ? 'bg-gradient-to-br text-white ' + gradientClass
                : 'border-2 border-gray-300 text-gray-400 dark:border-gray-600 dark:text-gray-500'}"
            >
              {#if step.complete}
                <span data-testid="step-{step.id}-check">
                  <Icon path={mdiCheck} size="16" />
                </span>
              {:else}
                <Icon path={step.icon} size="16" />
              {/if}
            </div>

            <!-- Step content -->
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium {step.complete ? 'text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-100'}">
                {step.label}
              </p>
              <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                {step.description}
              </p>
              {#if !step.complete && step.action}
                <button
                  class="mt-2 text-xs font-medium text-immich-primary hover:text-immich-primary/80
                    dark:text-immich-dark-primary dark:hover:text-immich-dark-primary/80"
                  onclick={step.action}
                  data-testid="step-{step.id}-action"
                >
                  {step.label}
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}
```

**Step 2: Run unit tests**

Run: `cd web && pnpm test -- --run src/lib/components/spaces/space-onboarding-banner.spec.ts`
Expected: ALL PASS

**Step 3: Commit**

```bash
git add web/src/lib/components/spaces/space-onboarding-banner.svelte web/src/lib/components/spaces/space-onboarding-banner.spec.ts
git commit -m "feat(web): add persistent onboarding banner component

Replaces the empty state checklist with a persistent progress banner
that tracks 3 setup steps (add photos, invite members, set cover).
Auto-hides when all steps are complete. Includes collapse/expand toggle."
```

---

## Task 6: Integrate Banner into Space Detail Page

**Files:**

- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`

**Step 1: Import and add the banner**

Add import at top:

```typescript
import SpaceOnboardingBanner from '$lib/components/spaces/space-onboarding-banner.svelte';
```

**Step 2: Add banner between hero section and timeline**

After the `</section>` that wraps SpaceHero and SpaceSearch (line 286), add:

```svelte
  {#if isOwner}
    <SpaceOnboardingBanner
      {space}
      gradientClass={spaceGradient}
      onAddPhotos={() => (viewMode = 'select-assets')}
      onInviteMembers={() => (membersPanelOpen = true)}
    />
  {/if}
```

**Step 3: Update the empty state snippet to remove owner checklist**

The `{#snippet empty()}` block (lines 297-307) should now show a simpler message for everyone when the space is empty, since the onboarding banner handles the guided steps:

```svelte
{#snippet empty()}
  {#if viewMode === 'view'}
    <div class="mx-auto max-w-md py-16 text-center">
      <p class="text-gray-500 dark:text-gray-400">{$t('spaces_no_assets')}</p>
    </div>
  {/if}
{/snippet}
```

**Step 4: Remove SpaceEmptyState import**

Remove the import line:

```typescript
import SpaceEmptyState from '$lib/components/spaces/space-empty-state.svelte';
```

**Step 5: Run web tests**

Run: `cd web && pnpm test -- --run`
Expected: PASS (the empty state tests may need updating — see Task 7)

**Step 6: Commit**

```bash
git add web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte
git commit -m "feat(web): integrate onboarding banner into space detail page

Banner shows between hero and timeline for owners. Replaces the old
empty state component with a simpler 'no photos' message."
```

---

## Task 7: Update E2E Tests

**Files:**

- Modify: `e2e/src/specs/web/spaces-p2.e2e-spec.ts`

**Step 1: Replace Empty State tests with Onboarding Banner tests**

Replace the `Empty State Onboarding` describe block (lines 109-132) with:

```typescript
test.describe('Onboarding Banner', () => {
  test('should show banner with 0/3 steps for owner in empty space', async ({ context, page }) => {
    const space = await utils.createSpace(admin.accessToken, { name: 'Banner Empty' });

    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto(`/spaces/${space.id}`);

    await expect(page.locator('[data-testid="onboarding-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="progress-text"]')).toContainText('0');
    await expect(page.locator('[data-testid="progress-text"]')).toContainText('3');
  });

  test('should show 1/3 after adding photos', async ({ context, page }) => {
    const space = await utils.createSpace(admin.accessToken, { name: 'Banner Photos' });
    const asset = await utils.createAsset(admin.accessToken);
    await utils.addSpaceAssets(admin.accessToken, space.id, [asset.id]);

    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto(`/spaces/${space.id}`);

    await expect(page.locator('[data-testid="onboarding-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="progress-text"]')).toContainText('1');
    await expect(page.locator('[data-testid="step-add-photos-check"]')).toBeVisible();
  });

  test('should show 2/3 after adding photos and members', async ({ context, page }) => {
    const space = await utils.createSpace(admin.accessToken, { name: 'Banner Members' });
    const asset = await utils.createAsset(admin.accessToken);
    await utils.addSpaceAssets(admin.accessToken, space.id, [asset.id]);
    await utils.addSpaceMember(admin.accessToken, space.id, { userId: user2.userId });

    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto(`/spaces/${space.id}`);

    await expect(page.locator('[data-testid="onboarding-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="progress-text"]')).toContainText('2');
    await expect(page.locator('[data-testid="step-add-photos-check"]')).toBeVisible();
    await expect(page.locator('[data-testid="step-invite-members-check"]')).toBeVisible();
  });

  test('should hide banner when all 3 steps complete', async ({ context, page }) => {
    const space = await utils.createSpace(admin.accessToken, { name: 'Banner Complete' });
    const asset = await utils.createAsset(admin.accessToken);
    await utils.addSpaceAssets(admin.accessToken, space.id, [asset.id]);
    await utils.addSpaceMember(admin.accessToken, space.id, { userId: user2.userId });
    // Set cover explicitly
    await utils.updateSpace(admin.accessToken, space.id, { thumbnailAssetId: asset.id });

    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto(`/spaces/${space.id}`);

    await expect(page.locator('[data-testid="onboarding-banner"]')).not.toBeVisible();
  });

  test('should not show banner for non-owner members', async ({ context, page }) => {
    const space = await utils.createSpace(admin.accessToken, { name: 'Banner Viewer' });
    await utils.addSpaceMember(admin.accessToken, space.id, { userId: user2.userId });

    await utils.setAuthCookies(context, user2.accessToken);
    await page.goto(`/spaces/${space.id}`);

    await expect(page.locator('[data-testid="onboarding-banner"]')).not.toBeVisible();
  });

  test('should collapse and expand banner', async ({ context, page }) => {
    const space = await utils.createSpace(admin.accessToken, { name: 'Banner Collapse' });

    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto(`/spaces/${space.id}`);

    await expect(page.locator('[data-testid="onboarding-banner"]')).toBeVisible();
    await page.locator('[data-testid="banner-collapse-toggle"]').click();
    await expect(page.locator('[data-testid="onboarding-banner"]')).toHaveAttribute('data-collapsed', 'true');
    await page.locator('[data-testid="banner-collapse-toggle"]').click();
    await expect(page.locator('[data-testid="onboarding-banner"]')).toHaveAttribute('data-collapsed', 'false');
  });
});
```

**Step 2: Add `updateSpace` utility if not present in e2e utils**

Check `e2e/src/utils.ts` — if there is no `updateSpace` helper, add one:

```typescript
updateSpace: (accessToken: string, id: string, dto: Partial<SharedSpaceUpdateDto>) =>
  updateSpace({ id, sharedSpaceUpdateDto: dto as SharedSpaceUpdateDto }, { headers: asBearerAuth(accessToken) }),
```

**Step 3: Commit**

```bash
git add e2e/src/specs/web/spaces-p2.e2e-spec.ts e2e/src/utils.ts
git commit -m "test(e2e): replace empty state tests with onboarding banner tests

6 E2E tests covering: progress tracking (0/3, 1/3, 2/3), auto-hide on
completion, owner-only visibility, and collapse/expand behavior."
```

---

## Task 8: Delete Old Empty State Component

**Files:**

- Delete: `web/src/lib/components/spaces/space-empty-state.svelte`

**Step 1: Verify no other files import the component**

Search for `space-empty-state` imports across the codebase. Should only be the space detail page (already updated in Task 6).

**Step 2: Delete the file**

```bash
rm web/src/lib/components/spaces/space-empty-state.svelte
```

**Step 3: Run all web tests to verify nothing breaks**

Run: `cd web && pnpm test -- --run`
Expected: PASS

**Step 4: Run type check**

Run: `cd web && npx svelte-check --tsconfig tsconfig.json`
Expected: No errors

**Step 5: Commit**

```bash
git add web/src/lib/components/spaces/space-empty-state.svelte
git commit -m "refactor(web): remove old space empty state component

Replaced by the persistent onboarding banner. The empty timeline now
shows a simple 'no photos' message instead."
```

---

## Task 9: Update SQL Query Documentation

**Files:**

- Modify: `server/src/queries/shared.space.repository.sql`

Since `addAssets` no longer calls `getById`, verify the SQL docs are still correct. The `getById` query is still used by other methods (`get`, etc.), so the SQL file should not change. But the auto-generated SQL must match.

**Step 1: Verify SQL docs are up to date**

Run: `cd server && pnpm sync:sql` (if DB is available) or verify manually that all `@GenerateSql`-decorated methods have their queries documented in the SQL file.

**Step 2: Run SQL schema check**

Run: `make check-server`
Expected: PASS

**Step 3: Commit (only if changes needed)**

---

## Task 10: Final Verification

**Step 1: Run full server test suite**

Run: `cd server && pnpm test -- --run`
Expected: ALL PASS

**Step 2: Run full web test suite**

Run: `cd web && pnpm test -- --run`
Expected: ALL PASS

**Step 3: Run lint and format**

Run:

```bash
make lint-server
make lint-web
make format-server
make format-web
```

**Step 4: Run type checks**

Run:

```bash
make check-server
make check-web
```

**Step 5: Verify E2E tests pass locally (if Docker available)**

Run: `cd e2e && pnpm test:web`

**Step 6: Final commit if any formatting/lint fixes needed**

```bash
git commit -m "chore: fix formatting and lint issues"
```
