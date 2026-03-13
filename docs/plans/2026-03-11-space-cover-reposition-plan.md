# Space Cover Photo Repositioning Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let users drag the space cover photo vertically within the hero banner to choose which portion is visible, and persist that position.

**Architecture:** Add a `thumbnailCropY` smallint column to `shared_space` table. The value (0–100) maps to CSS `object-position: center {value}%`. No server-side image processing — purely a display hint. The hero enters a drag-to-reposition mode triggered by a "Reposition" button (when a cover exists) or automatically after selecting a new cover.

**Tech Stack:** NestJS (server), Kysely (DB), Svelte 5 (web), Vitest (tests)

---

### Task 1: Database Schema — Add `thumbnailCropY` Column

**Files:**

- Modify: `server/src/schema/tables/shared-space.table.ts:34` (add column after `color`)
- Modify: `server/src/database.ts:320-332` (add field to `SharedSpace` type)
- Create: `server/src/schema/migrations/1772810000000-AddThumbnailCropYToSharedSpace.ts`

**Step 1: Write the migration file**

```typescript
// server/src/schema/migrations/1772810000000-AddThumbnailCropYToSharedSpace.ts
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "shared_space" ADD "thumbnailCropY" smallint`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "shared_space" DROP COLUMN "thumbnailCropY"`.execute(db);
}
```

**Step 2: Add column to schema table class**

In `server/src/schema/tables/shared-space.table.ts`, add after the `color` column (line 34):

```typescript
@Column({ type: 'smallint', nullable: true })
thumbnailCropY!: number | null;
```

**Step 3: Update database.ts SharedSpace type**

In `server/src/database.ts`, add to the `SharedSpace` type (after `color`):

```typescript
thumbnailCropY: number | null;
```

**Step 4: Commit**

```bash
git add server/src/schema/migrations/1772810000000-AddThumbnailCropYToSharedSpace.ts \
  server/src/schema/tables/shared-space.table.ts \
  server/src/database.ts
git commit -m "feat(server): add thumbnailCropY column to shared_space table"
```

---

### Task 2: Server DTO & Service — Wire Up `thumbnailCropY`

**Files:**

- Modify: `server/src/dtos/shared-space.dto.ts:29-53` (SharedSpaceUpdateDto) and `112-160` (SharedSpaceResponseDto)
- Modify: `server/src/services/shared-space.service.ts:116-129` (update method) and `332-354` (mapSpace)

**Step 1: Write failing test**

Create `server/src/services/shared-space.service.spec.ts`:

```typescript
import { SharedSpaceService } from 'src/services/shared-space.service';
import { factory, newUuid } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';

describe(SharedSpaceService.name, () => {
  let sut: SharedSpaceService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(SharedSpaceService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('update', () => {
    it('should pass thumbnailCropY to repository', async () => {
      const spaceId = newUuid();
      const auth = factory.auth();
      const member = { role: 'editor', userId: auth.user.id };

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.update.mockResolvedValue({
        id: spaceId,
        name: 'Test',
        description: null,
        createdById: auth.user.id,
        thumbnailAssetId: newUuid(),
        thumbnailCropY: 30,
        color: 'primary',
        lastActivityAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await sut.update(auth, spaceId, { thumbnailCropY: 30 });

      expect(mocks.sharedSpace.update).toHaveBeenCalledWith(spaceId, expect.objectContaining({ thumbnailCropY: 30 }));
    });

    it('should return thumbnailCropY in response', async () => {
      const spaceId = newUuid();
      const auth = factory.auth();
      const member = { role: 'editor', userId: auth.user.id };

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.update.mockResolvedValue({
        id: spaceId,
        name: 'Test',
        description: null,
        createdById: auth.user.id,
        thumbnailAssetId: newUuid(),
        thumbnailCropY: 75,
        color: 'primary',
        lastActivityAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await sut.update(auth, spaceId, { thumbnailCropY: 75 });

      expect(result.thumbnailCropY).toBe(75);
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

Expected: FAIL — `thumbnailCropY` not recognized in DTO/response.

**Step 3: Add `thumbnailCropY` to `SharedSpaceUpdateDto`**

In `server/src/dtos/shared-space.dto.ts`, add after `thumbnailAssetId` (line 44):

```typescript
@ApiPropertyOptional({ description: 'Vertical crop position for cover photo (0-100)', type: 'integer' })
@IsOptional()
@IsInt()
@Min(0)
@Max(100)
thumbnailCropY?: number | null;
```

Add imports at top: `IsInt`, `Min`, `Max` from `class-validator`.

**Step 4: Add `thumbnailCropY` to `SharedSpaceResponseDto`**

In the response DTO, add after `thumbnailAssetId` (line 138):

```typescript
@ApiPropertyOptional({ description: 'Vertical crop position for cover photo (0-100)' })
thumbnailCropY?: number | null;
```

**Step 5: Update service `update()` method**

In `server/src/services/shared-space.service.ts:121-126`, add `thumbnailCropY` to the update call:

```typescript
const space = await this.sharedSpaceRepository.update(id, {
  name: dto.name,
  description: dto.description,
  thumbnailAssetId: dto.thumbnailAssetId,
  thumbnailCropY: dto.thumbnailCropY,
  color: dto.color,
});
```

**Step 6: Update `mapSpace` to include `thumbnailCropY`**

In `server/src/services/shared-space.service.ts`, update `mapSpace` method signature and body:

Add `thumbnailCropY?: number | null;` to the input type, and add to the return:

```typescript
thumbnailCropY: space.thumbnailCropY ?? null,
```

**Step 7: Run test to verify it passes**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

Expected: PASS

**Step 8: Commit**

```bash
git add server/src/dtos/shared-space.dto.ts \
  server/src/services/shared-space.service.ts \
  server/src/services/shared-space.service.spec.ts
git commit -m "feat(server): add thumbnailCropY to shared space DTO and service"
```

---

### Task 3: Server — Clear `thumbnailCropY` When Cover Changes

**Files:**

- Modify: `server/src/services/shared-space.service.spec.ts` (add test)
- Modify: `server/src/services/shared-space.service.ts:116-129`

**Step 1: Write failing test**

Add to `shared-space.service.spec.ts` under `describe('update')`:

```typescript
it('should clear thumbnailCropY when thumbnailAssetId changes', async () => {
  const spaceId = newUuid();
  const auth = factory.auth();
  const member = { role: 'editor', userId: auth.user.id };

  mocks.sharedSpace.getMember.mockResolvedValue(member);
  mocks.sharedSpace.update.mockResolvedValue({
    id: spaceId,
    name: 'Test',
    description: null,
    createdById: auth.user.id,
    thumbnailAssetId: newUuid(),
    thumbnailCropY: null,
    color: 'primary',
    lastActivityAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await sut.update(auth, spaceId, { thumbnailAssetId: newUuid() });

  expect(mocks.sharedSpace.update).toHaveBeenCalledWith(spaceId, expect.objectContaining({ thumbnailCropY: null }));
});
```

**Step 2: Run test to verify it fails**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

Expected: FAIL — `thumbnailCropY` is `undefined`, not `null`.

**Step 3: Implement the reset logic**

In `server/src/services/shared-space.service.ts`, in the `update()` method, add before the repository call:

```typescript
// Reset crop position when cover photo changes
const thumbnailCropY = dto.thumbnailAssetId !== undefined ? null : dto.thumbnailCropY;
```

And use `thumbnailCropY` (local variable) instead of `dto.thumbnailCropY` in the update call.

**Step 4: Run test to verify it passes**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add server/src/services/shared-space.service.ts \
  server/src/services/shared-space.service.spec.ts
git commit -m "feat(server): reset thumbnailCropY when cover photo changes"
```

---

### Task 4: Regenerate OpenAPI & SDK

**Files:**

- Modified (auto-generated): `open-api/immich-openapi-specs.json`, `open-api/typescript-sdk/src/fetch-client.ts`

**Step 1: Build server and regenerate**

```bash
cd server && pnpm build
cd server && pnpm sync:open-api
make open-api-typescript
```

**Step 2: Verify `thumbnailCropY` appears in generated SDK**

```bash
grep -n 'thumbnailCropY' open-api/typescript-sdk/src/fetch-client.ts
```

Expected: Field appears in both request and response types.

**Step 3: Commit**

```bash
git add open-api/ server/immich-openapi-specs.json
git commit -m "chore: regenerate OpenAPI spec and TypeScript SDK"
```

---

### Task 5: Web — Apply `object-position` to Hero Image

**Files:**

- Modify: `web/src/lib/components/spaces/space-hero.svelte:38-44`

**Step 1: Write test**

Create `web/src/lib/components/spaces/space-hero.spec.ts`:

```typescript
import { render, screen } from '@testing-library/svelte';
import SpaceHero from '$lib/components/spaces/space-hero.svelte';

describe('SpaceHero', () => {
  const baseSpace = {
    id: 'space-1',
    name: 'Test Space',
    description: null,
    createdById: 'user-1',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    thumbnailAssetId: 'asset-1',
    thumbnailCropY: null,
  };

  it('should use default center position when thumbnailCropY is null', () => {
    render(SpaceHero, {
      props: { space: baseSpace, memberCount: 3, assetCount: 10 },
    });

    const img = screen.getByTestId('hero-cover-image');
    expect(img.style.objectPosition).toBe('center 50%');
  });

  it('should apply custom object-position from thumbnailCropY', () => {
    render(SpaceHero, {
      props: {
        space: { ...baseSpace, thumbnailCropY: 25 },
        memberCount: 3,
        assetCount: 10,
      },
    });

    const img = screen.getByTestId('hero-cover-image');
    expect(img.style.objectPosition).toBe('center 25%');
  });

  it('should not render image when no thumbnailAssetId', () => {
    render(SpaceHero, {
      props: {
        space: { ...baseSpace, thumbnailAssetId: null },
        memberCount: 3,
        assetCount: 10,
      },
    });

    expect(screen.queryByTestId('hero-cover-image')).not.toBeInTheDocument();
    expect(screen.getByTestId('hero-gradient')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd web && pnpm test -- --run src/lib/components/spaces/space-hero.spec.ts
```

Expected: FAIL — `objectPosition` not set on the image.

**Step 3: Apply object-position to hero image**

In `web/src/lib/components/spaces/space-hero.svelte`, update the `<img>` tag (line 39-43):

```svelte
<img
  src={coverUrl}
  alt={space.name}
  class="absolute inset-0 size-full object-cover"
  style="object-position: center {space.thumbnailCropY ?? 50}%;"
  data-testid="hero-cover-image"
/>
```

**Step 4: Run test to verify it passes**

```bash
cd web && pnpm test -- --run src/lib/components/spaces/space-hero.spec.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add web/src/lib/components/spaces/space-hero.svelte \
  web/src/lib/components/spaces/space-hero.spec.ts
git commit -m "feat(web): apply thumbnailCropY as object-position on space hero"
```

---

### Task 6: Web — Dual Button Layout (Reposition + Change Cover)

**Files:**

- Modify: `web/src/lib/components/spaces/space-hero.svelte`
- Modify: `web/src/lib/components/spaces/space-hero.spec.ts`

**Step 1: Write tests for button states**

Add to `space-hero.spec.ts`:

```typescript
it('should show "Set cover photo" button when no cover and onSetCover provided', () => {
  render(SpaceHero, {
    props: {
      space: { ...baseSpace, thumbnailAssetId: null },
      memberCount: 3,
      assetCount: 10,
      onSetCover: () => {},
    },
  });

  expect(screen.getByTestId('hero-set-cover-button')).toBeInTheDocument();
  expect(screen.queryByTestId('hero-reposition-button')).not.toBeInTheDocument();
});

it('should show both Reposition and Change Cover buttons when cover exists', () => {
  render(SpaceHero, {
    props: {
      space: baseSpace,
      memberCount: 3,
      assetCount: 10,
      onSetCover: () => {},
      onReposition: () => {},
    },
  });

  expect(screen.getByTestId('hero-reposition-button')).toBeInTheDocument();
  expect(screen.getByTestId('hero-change-cover-button')).toBeInTheDocument();
  expect(screen.queryByTestId('hero-set-cover-button')).not.toBeInTheDocument();
});
```

**Step 2: Run tests to verify they fail**

```bash
cd web && pnpm test -- --run src/lib/components/spaces/space-hero.spec.ts
```

**Step 3: Update hero component button layout**

In `space-hero.svelte`, add `onReposition` to Props interface:

```typescript
interface Props {
  space: SharedSpaceResponseDto;
  memberCount: number;
  assetCount: number;
  currentRole?: string;
  gradientClass?: string;
  onSetCover?: () => void;
  onReposition?: () => void;
}
```

Update the destructure and replace the button section (lines 50-60):

```svelte
{#if space.thumbnailAssetId && onReposition && onSetCover}
  <div class="absolute right-3 top-3 flex gap-1.5">
    <button
      type="button"
      class="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/60"
      onclick={onReposition}
      data-testid="hero-reposition-button"
    >
      <Icon icon={mdiCursorMove} size="14" />
      {$t('reposition')}
    </button>
    <button
      type="button"
      class="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/60"
      onclick={onSetCover}
      data-testid="hero-change-cover-button"
    >
      <Icon icon={mdiImageEditOutline} size="14" />
      {$t('change_cover_photo')}
    </button>
  </div>
{:else if onSetCover}
  <button
    type="button"
    class="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/60"
    onclick={onSetCover}
    data-testid="hero-set-cover-button"
  >
    <Icon icon={mdiImageEditOutline} size="14" />
    {$t('set_cover_photo')}
  </button>
{/if}
```

Add import: `mdiCursorMove` from `@mdi/js`.

**Step 4: Add i18n keys**

In `i18n/en.json`, add:

```json
"reposition": "Reposition",
"change_cover_photo": "Change cover",
```

**Step 5: Run tests to verify they pass**

```bash
cd web && pnpm test -- --run src/lib/components/spaces/space-hero.spec.ts
```

**Step 6: Commit**

```bash
git add web/src/lib/components/spaces/space-hero.svelte \
  web/src/lib/components/spaces/space-hero.spec.ts \
  i18n/en.json
git commit -m "feat(web): add Reposition and Change Cover buttons to space hero"
```

---

### Task 7: Web — Reposition Mode with Drag Interaction

**Files:**

- Modify: `web/src/lib/components/spaces/space-hero.svelte`
- Modify: `web/src/lib/components/spaces/space-hero.spec.ts`

**Step 1: Write tests for reposition mode**

Add to `space-hero.spec.ts`:

```typescript
import { fireEvent } from '@testing-library/svelte';

it('should show reposition overlay when repositioning prop is true', () => {
  render(SpaceHero, {
    props: {
      space: baseSpace,
      memberCount: 3,
      assetCount: 10,
      repositioning: true,
    },
  });

  expect(screen.getByTestId('reposition-overlay')).toBeInTheDocument();
  expect(screen.getByTestId('reposition-hint')).toBeInTheDocument();
  expect(screen.getByTestId('reposition-save-button')).toBeInTheDocument();
  expect(screen.getByTestId('reposition-cancel-button')).toBeInTheDocument();
});

it('should not show hero buttons during reposition mode', () => {
  render(SpaceHero, {
    props: {
      space: baseSpace,
      memberCount: 3,
      assetCount: 10,
      repositioning: true,
      onSetCover: () => {},
      onReposition: () => {},
    },
  });

  expect(screen.queryByTestId('hero-reposition-button')).not.toBeInTheDocument();
  expect(screen.queryByTestId('hero-change-cover-button')).not.toBeInTheDocument();
});

it('should call onSavePosition with crop value on save', async () => {
  const onSavePosition = vi.fn();
  render(SpaceHero, {
    props: {
      space: { ...baseSpace, thumbnailCropY: 40 },
      memberCount: 3,
      assetCount: 10,
      repositioning: true,
      onSavePosition,
    },
  });

  await fireEvent.click(screen.getByTestId('reposition-save-button'));
  expect(onSavePosition).toHaveBeenCalledWith(expect.any(Number));
});

it('should call onCancelReposition on cancel', async () => {
  const onCancelReposition = vi.fn();
  render(SpaceHero, {
    props: {
      space: baseSpace,
      memberCount: 3,
      assetCount: 10,
      repositioning: true,
      onCancelReposition,
    },
  });

  await fireEvent.click(screen.getByTestId('reposition-cancel-button'));
  expect(onCancelReposition).toHaveBeenCalled();
});
```

**Step 2: Run tests to verify they fail**

```bash
cd web && pnpm test -- --run src/lib/components/spaces/space-hero.spec.ts
```

**Step 3: Implement reposition mode**

Update `space-hero.svelte` Props:

```typescript
interface Props {
  space: SharedSpaceResponseDto;
  memberCount: number;
  assetCount: number;
  currentRole?: string;
  gradientClass?: string;
  onSetCover?: () => void;
  onReposition?: () => void;
  repositioning?: boolean;
  onSavePosition?: (cropY: number) => void;
  onCancelReposition?: () => void;
}
```

Add drag state and logic in the script block:

```typescript
let dragCropY = $state(space.thumbnailCropY ?? 50);
let isDragging = $state(false);
let dragStartY = $state(0);
let dragStartCropY = $state(50);
let hasInteracted = $state(false);

// Reset dragCropY when entering reposition mode
$effect(() => {
  if (repositioning) {
    dragCropY = space.thumbnailCropY ?? 50;
    hasInteracted = false;
  }
});

let displayCropY = $derived(repositioning ? dragCropY : (space.thumbnailCropY ?? 50));

const handlePointerDown = (e: PointerEvent) => {
  if (!repositioning) return;
  isDragging = true;
  dragStartY = e.clientY;
  dragStartCropY = dragCropY;
  (e.target as HTMLElement).setPointerCapture(e.pointerId);
};

const handlePointerMove = (e: PointerEvent) => {
  if (!isDragging) return;
  hasInteracted = true;
  const deltaY = e.clientY - dragStartY;
  // Moving pointer down = seeing higher part of image = lower cropY
  // Scale: 250px hero height, ~2px movement = 1% change
  const deltaPct = -(deltaY / 2.5);
  dragCropY = Math.round(Math.min(100, Math.max(0, dragStartCropY + deltaPct)));
};

const handlePointerUp = () => {
  isDragging = false;
};

const handleSave = () => {
  onSavePosition?.(dragCropY);
};

const handleCancel = () => {
  onCancelReposition?.();
};
```

Update the image style to use `displayCropY`:

```svelte
<img
  src={coverUrl}
  alt={space.name}
  class="absolute inset-0 size-full object-cover"
  class:cursor-grab={repositioning && !isDragging}
  class:cursor-grabbing={repositioning && isDragging}
  style="object-position: center {displayCropY}%;"
  onpointerdown={handlePointerDown}
  onpointermove={handlePointerMove}
  onpointerup={handlePointerUp}
  data-testid="hero-cover-image"
/>
```

Add reposition overlay (after the image, before the gradient overlay, only when `repositioning`):

```svelte
{#if repositioning}
  <div
    class="absolute inset-0 pointer-events-none"
    data-testid="reposition-overlay"
  >
    <div class="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/30 to-transparent"></div>
    <div class="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/30 to-transparent"></div>

    {#if !hasInteracted}
      <div
        class="absolute inset-0 flex items-center justify-center"
        data-testid="reposition-hint"
      >
        <span class="rounded-full bg-black/50 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
          {$t('drag_to_reposition')}
        </span>
      </div>
    {/if}

    <div class="pointer-events-auto absolute bottom-3 right-3 flex gap-2">
      <button
        type="button"
        class="rounded-full border border-white/30 bg-black/40 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/60"
        onclick={handleCancel}
        data-testid="reposition-cancel-button"
      >
        {$t('cancel')}
      </button>
      <button
        type="button"
        class="rounded-full bg-white px-4 py-1.5 text-xs font-medium text-black transition-colors hover:bg-white/90"
        onclick={handleSave}
        data-testid="reposition-save-button"
      >
        {$t('save')}
      </button>
    </div>
  </div>
{/if}
```

Hide the normal buttons and info overlay when `repositioning` is true — wrap them with `{#if !repositioning}`.

**Step 4: Add i18n key**

In `i18n/en.json`:

```json
"drag_to_reposition": "Drag to reposition",
```

**Step 5: Run tests to verify they pass**

```bash
cd web && pnpm test -- --run src/lib/components/spaces/space-hero.spec.ts
```

**Step 6: Commit**

```bash
git add web/src/lib/components/spaces/space-hero.svelte \
  web/src/lib/components/spaces/space-hero.spec.ts \
  i18n/en.json
git commit -m "feat(web): add reposition mode with drag interaction to space hero"
```

---

### Task 8: Web — Wire Up Space Detail Page

**Files:**

- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`

**Step 1: Add reposition state and handlers**

In the space detail page script, add state:

```typescript
let repositioning = $state(false);
```

Add handler functions:

```typescript
const handleReposition = () => {
  repositioning = true;
};

const handleSavePosition = async (cropY: number) => {
  try {
    await updateSpace({
      id: space.id,
      sharedSpaceUpdateDto: { thumbnailCropY: cropY },
    });
    space = { ...space, thumbnailCropY: cropY };
    repositioning = false;
    toastManager.success($t('space_cover_updated'));
  } catch (error) {
    handleError(error, $t('errors.unable_to_update_space_cover'));
  }
};

const handleCancelReposition = () => {
  repositioning = false;
};
```

**Step 2: Update `handleSetCoverFromSelection` to enter reposition mode**

In the existing `handleSetCoverFromSelection` function, after setting the cover successfully, enter reposition mode instead of going back to view:

```typescript
space = { ...space, thumbnailAssetId: assets[0].id, thumbnailCropY: null };
toastManager.success($t('space_cover_updated'));
assetInteraction.clearMultiselect();
viewMode = 'view';
repositioning = true; // Auto-enter reposition after selecting new cover
```

Do the same in `handleSetAsCover`.

**Step 3: Pass new props to SpaceHero**

Update the `<SpaceHero>` usage:

```svelte
<SpaceHero
  {space}
  memberCount={members.length}
  assetCount={space.assetCount ?? 0}
  currentRole={currentMember?.role}
  gradientClass={spaceGradient}
  onSetCover={isEditor ? () => (viewMode = 'select-cover') : undefined}
  onReposition={isEditor && space.thumbnailAssetId ? handleReposition : undefined}
  {repositioning}
  onSavePosition={handleSavePosition}
  onCancelReposition={handleCancelReposition}
/>
```

**Step 4: Verify manually (no automated test for page wiring)**

```bash
cd web && pnpm check
```

**Step 5: Commit**

```bash
git add web/src/routes/\(user\)/spaces/\[spaceId\]/\[\[photos=photos\]\]/\[\[assetId=id\]\]/+page.svelte
git commit -m "feat(web): wire reposition mode into space detail page"
```

---

### Task 9: Final Verification & Cleanup

**Step 1: Run all server tests**

```bash
cd server && pnpm test -- --run
```

**Step 2: Run all web tests**

```bash
cd web && pnpm test -- --run
```

**Step 3: Run linting and type checks**

```bash
make lint-server && make lint-web
make check-server && make check-web
```

**Step 4: Format**

```bash
make format-server && make format-web
```

**Step 5: Commit any formatting fixes**

```bash
git add -A && git commit -m "chore: format"
```
