# Spaces P0: Visual Identity & Information Hierarchy — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add space colors with gradient placeholders, stat chips, and role badges to make Shared Spaces visually distinct from Albums.

**Architecture:** Add a `color` column (varchar, UserAvatarColor enum) to the `shared_spaces` table. Thread it through DTOs, service, OpenAPI, and render it in web components. All web changes are Svelte 5 with Tailwind CSS. Follow TDD — write failing tests first, then implement.

**Tech Stack:** NestJS (server), Kysely (DB), Vitest (tests), Svelte 5 (web), Tailwind CSS 4, OpenAPI codegen

---

### Task 1: Database Migration — Add `color` column

**Files:**

- Create: `server/src/schema/migrations/1772270000000-AddColorToSharedSpace.ts`
- Modify: `server/src/schema/tables/shared-space.table.ts`
- Modify: `server/src/database.ts:320-330`

**Step 1: Create the migration file**

```typescript
// server/src/schema/migrations/1772270000000-AddColorToSharedSpace.ts
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "shared_space" ADD "color" character varying(20) DEFAULT 'primary'`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "shared_space" DROP COLUMN "color"`.execute(db);
}
```

**Step 2: Add column to schema table**

In `server/src/schema/tables/shared-space.table.ts`, add after the `thumbnailAssetId` column:

```typescript
@Column({ type: 'character varying', length: 20, default: "'primary'", nullable: true })
color!: string | null;
```

**Step 3: Update database.ts types**

In `server/src/database.ts`, add `color` to the `SharedSpace` type:

```typescript
export type SharedSpace = {
  id: string;
  name: string;
  description: string | null;
  createdById: string;
  thumbnailAssetId: string | null;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
  createId: string;
  updateId: string;
};
```

**Step 4: Commit**

```bash
git add server/src/schema/migrations/1772270000000-AddColorToSharedSpace.ts server/src/schema/tables/shared-space.table.ts server/src/database.ts
git commit -m "feat(server): add color column to shared_spaces table"
```

---

### Task 2: Server DTOs — Add `color` to Create/Update/Response DTOs

**Files:**

- Modify: `server/src/dtos/shared-space.dto.ts`

**Step 1: Add color to SharedSpaceCreateDto**

Add after `description`:

```typescript
@ValidateEnum({
  enum: UserAvatarColor,
  name: 'UserAvatarColor',
  description: 'Space color',
  optional: true,
  default: UserAvatarColor.Primary,
})
color?: UserAvatarColor;
```

Add `UserAvatarColor` to the import from `src/enum`.

**Step 2: Add color to SharedSpaceUpdateDto**

Add after `thumbnailAssetId`:

```typescript
@ValidateEnum({
  enum: UserAvatarColor,
  name: 'UserAvatarColor',
  description: 'Space color',
  optional: true,
})
color?: UserAvatarColor;
```

**Step 3: Add color to SharedSpaceResponseDto**

Add after `thumbnailAssetId`:

```typescript
@ApiPropertyOptional({ description: 'Space color', enum: UserAvatarColor })
color?: UserAvatarColor | null;
```

Import `UserAvatarColor` from `@immich/sdk` or `src/enum` (check existing pattern).

**Step 4: Commit**

```bash
git add server/src/dtos/shared-space.dto.ts
git commit -m "feat(server): add color field to shared space DTOs"
```

---

### Task 3: Server Service — Thread `color` through create/update/mapSpace

**Files:**

- Modify: `server/src/services/shared-space.service.ts`
- Test: `server/src/services/shared-space.service.spec.ts`

**Step 1: Write failing test — create with color**

Add to `server/src/services/shared-space.service.spec.ts` in the `create` describe block:

```typescript
it('should pass color when provided', async () => {
  const auth = factory.auth();
  const space = factory.sharedSpace({ createdById: auth.user.id, color: 'blue' });

  mocks.sharedSpace.create.mockResolvedValue(space);
  mocks.sharedSpace.addMember.mockResolvedValue(
    factory.sharedSpaceMember({
      spaceId: space.id,
      userId: auth.user.id,
      role: SharedSpaceRole.Owner,
    }),
  );

  const result = await sut.create(auth, { name: 'Test Space', color: UserAvatarColor.Blue });

  expect(result.color).toBe('blue');
  expect(mocks.sharedSpace.create).toHaveBeenCalledWith({
    name: 'Test Space',
    description: null,
    color: UserAvatarColor.Blue,
    createdById: auth.user.id,
  });
});

it('should default color to primary when not provided', async () => {
  const auth = factory.auth();
  const space = factory.sharedSpace({ createdById: auth.user.id, color: 'primary' });

  mocks.sharedSpace.create.mockResolvedValue(space);
  mocks.sharedSpace.addMember.mockResolvedValue(
    factory.sharedSpaceMember({
      spaceId: space.id,
      userId: auth.user.id,
      role: SharedSpaceRole.Owner,
    }),
  );

  const result = await sut.create(auth, { name: 'Test Space' });

  expect(result.color).toBe('primary');
  expect(mocks.sharedSpace.create).toHaveBeenCalledWith({
    name: 'Test Space',
    description: null,
    color: 'primary',
    createdById: auth.user.id,
  });
});
```

Add `UserAvatarColor` to the import from `src/enum`.

**Step 2: Run test to verify it fails**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

Expected: FAIL — `create` doesn't pass `color` to repository, `mapSpace` doesn't return `color`.

**Step 3: Write failing test — update color requires owner**

Add to the `update` describe block:

```typescript
it('should allow owner to update color', async () => {
  const auth = factory.auth();
  const space = factory.sharedSpace();
  const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Owner });
  const updatedSpace = { ...space, color: 'blue' };

  mocks.sharedSpace.getMember.mockResolvedValue(member);
  mocks.sharedSpace.update.mockResolvedValue(updatedSpace);

  const result = await sut.update(auth, space.id, { color: UserAvatarColor.Blue });

  expect(result.color).toBe('blue');
  expect(mocks.sharedSpace.update).toHaveBeenCalledWith(space.id, {
    name: undefined,
    description: undefined,
    thumbnailAssetId: undefined,
    color: UserAvatarColor.Blue,
  });
});

it('should not allow editor to update color', async () => {
  const auth = factory.auth();
  const space = factory.sharedSpace();
  const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Editor });

  mocks.sharedSpace.getMember.mockResolvedValue(member);

  await expect(sut.update(auth, space.id, { color: UserAvatarColor.Blue })).rejects.toBeInstanceOf(ForbiddenException);
});
```

**Step 4: Write failing test — getAll includes color**

Add to the `getAll` describe block:

```typescript
it('should include color in response', async () => {
  const auth = factory.auth();
  const space = factory.sharedSpace({ name: 'Blue Space', color: 'blue' });

  mocks.sharedSpace.getAllByUserId.mockResolvedValue([space]);
  mocks.sharedSpace.getMembers.mockResolvedValue([]);
  mocks.sharedSpace.getAssetCount.mockResolvedValue(0);

  const result = await sut.getAll(auth);

  expect(result[0].color).toBe('blue');
});
```

**Step 5: Write failing test — get includes color**

Add to the `get` describe block:

```typescript
it('should include color in response', async () => {
  const auth = factory.auth();
  const space = factory.sharedSpace({ color: 'green' });
  const member = makeMemberResult({
    spaceId: space.id,
    userId: auth.user.id,
    role: SharedSpaceRole.Viewer,
  });

  mocks.sharedSpace.getMember.mockResolvedValue(member);
  mocks.sharedSpace.getById.mockResolvedValue(space);
  mocks.sharedSpace.getMembers.mockResolvedValue([member]);
  mocks.sharedSpace.getAssetCount.mockResolvedValue(0);
  mocks.sharedSpace.getMostRecentAssetId.mockResolvedValue(void 0);

  const result = await sut.get(auth, space.id);

  expect(result.color).toBe('green');
});
```

**Step 6: Run tests to verify they all fail**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

Expected: Multiple FAILs related to color.

**Step 7: Implement — update service**

In `server/src/services/shared-space.service.ts`:

1. In `create()`, change the repository call:

```typescript
const space = await this.sharedSpaceRepository.create({
  name: dto.name,
  description: dto.description ?? null,
  color: dto.color ?? 'primary',
  createdById: auth.user.id,
});
```

2. In `update()`, add `color` to the metadata check and pass it through:

```typescript
const isMetadataUpdate = dto.name !== undefined || dto.description !== undefined || dto.color !== undefined;
```

And in the update call:

```typescript
const space = await this.sharedSpaceRepository.update(id, {
  name: dto.name,
  description: dto.description,
  thumbnailAssetId: dto.thumbnailAssetId,
  color: dto.color,
});
```

3. In `mapSpace()`, add `color` to the type signature and return:

```typescript
private mapSpace(space: {
  id: string;
  name: string;
  description: string | null;
  createdById: string;
  createdAt: unknown;
  updatedAt: unknown;
  thumbnailAssetId?: string | null;
  color?: string | null;
}): SharedSpaceResponseDto {
  return {
    id: space.id,
    name: space.name,
    description: space.description,
    createdById: space.createdById,
    createdAt: space.createdAt as unknown as string,
    updatedAt: space.updatedAt as unknown as string,
    thumbnailAssetId: space.thumbnailAssetId ?? null,
    color: (space.color as UserAvatarColor) ?? null,
  };
}
```

Add `UserAvatarColor` to the import from `src/enum`.

**Step 8: Update test factory**

In `server/test/small.factory.ts`, add `color` to the `sharedSpaceFactory`:

```typescript
const sharedSpaceFactory = (data: Partial<SharedSpace> = {}): SharedSpace => ({
  id: newUuid(),
  name: 'Test Space',
  description: null,
  createdById: newUuid(),
  thumbnailAssetId: null,
  color: 'primary',
  createdAt: newDate(),
  updatedAt: newDate(),
  createId: newUuid(),
  updateId: newUuid(),
  ...data,
});
```

**Step 9: Run tests to verify they pass**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

Expected: ALL PASS

**Step 10: Verify existing tests still pass**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts 2>&1 | tail -20
```

Check that no existing tests broke (especially the `update` tests that check `isMetadataUpdate`).

**Step 11: Commit**

```bash
git add server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts server/test/small.factory.ts
git commit -m "feat(server): thread color through shared space service with TDD"
```

---

### Task 4: Regenerate OpenAPI clients

**Files:**

- Modified by codegen: `open-api/immich-openapi-specs.json`, `open-api/typescript-sdk/src/fetch-client.ts`, `mobile/openapi/`

**Step 1: Build server**

```bash
cd server && pnpm build
```

**Step 2: Sync OpenAPI spec**

```bash
cd server && pnpm sync:open-api
```

**Step 3: Regenerate clients**

```bash
make open-api
```

**Step 4: Verify TypeScript SDK has color**

```bash
grep -n "color" open-api/typescript-sdk/src/fetch-client.ts | head -20
```

Confirm `SharedSpaceCreateDto`, `SharedSpaceUpdateDto`, and `SharedSpaceResponseDto` all include `color`.

**Step 5: Commit**

```bash
git add open-api/ mobile/openapi/
git commit -m "chore: regenerate OpenAPI clients with space color field"
```

---

### Task 5: Web — Color Swatch Picker Component

**Files:**

- Create: `web/src/lib/components/spaces/color-picker.svelte`

**Step 1: Create the color picker component**

```svelte
<script lang="ts">
  import { UserAvatarColor } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiCheck } from '@mdi/js';

  interface Props {
    value: UserAvatarColor;
    onchange: (color: UserAvatarColor) => void;
  }

  let { value, onchange }: Props = $props();

  const colors: { value: UserAvatarColor; class: string }[] = [
    { value: UserAvatarColor.Primary, class: 'bg-primary' },
    { value: UserAvatarColor.Pink, class: 'bg-pink-400' },
    { value: UserAvatarColor.Red, class: 'bg-red-500' },
    { value: UserAvatarColor.Yellow, class: 'bg-yellow-500' },
    { value: UserAvatarColor.Blue, class: 'bg-blue-500' },
    { value: UserAvatarColor.Green, class: 'bg-green-600' },
    { value: UserAvatarColor.Purple, class: 'bg-purple-600' },
    { value: UserAvatarColor.Orange, class: 'bg-orange-600' },
    { value: UserAvatarColor.Gray, class: 'bg-gray-600' },
    { value: UserAvatarColor.Amber, class: 'bg-amber-600' },
  ];
</script>

<div class="flex gap-2 flex-wrap">
  {#each colors as color (color.value)}
    <button
      type="button"
      class="flex h-7 w-7 items-center justify-center rounded-full transition-transform {color.class}"
      class:ring-2={value === color.value}
      class:ring-offset-2={value === color.value}
      class:ring-gray-800={value === color.value}
      class:dark:ring-gray-200={value === color.value}
      class:dark:ring-offset-gray-900={value === color.value}
      class:scale-110={value === color.value}
      onclick={() => onchange(color.value)}
      aria-label={color.value}
      data-testid="color-swatch-{color.value}"
    >
      {#if value === color.value}
        <Icon icon={mdiCheck} size="14" class="text-white" />
      {/if}
    </button>
  {/each}
</div>
```

**Step 2: Commit**

```bash
git add web/src/lib/components/spaces/color-picker.svelte
git commit -m "feat(web): add color picker component for spaces"
```

---

### Task 6: Web — Update SpaceCreateModal with color picker

**Files:**

- Modify: `web/src/lib/modals/SpaceCreateModal.svelte`

**Step 1: Add color picker to create modal**

Import `ColorPicker` and `UserAvatarColor`, add state, pass to DTO:

```svelte
<script lang="ts">
  import ColorPicker from '$lib/components/spaces/color-picker.svelte';
  import { createSpace, UserAvatarColor, type SharedSpaceResponseDto } from '@immich/sdk';
  import { Field, FormModal, Input, Textarea } from '@immich/ui';
  import { mdiAccountGroup } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: (space?: SharedSpaceResponseDto) => void;
  };

  let { onClose }: Props = $props();

  let name = $state('');
  let description = $state('');
  let color = $state<UserAvatarColor>(UserAvatarColor.Primary);

  const onSubmit = async () => {
    const space = await createSpace({
      sharedSpaceCreateDto: {
        name,
        description: description || undefined,
        color,
      },
    });
    onClose(space);
  };
</script>

<FormModal icon={mdiAccountGroup} title={$t('spaces_create')} size="small" {onClose} {onSubmit}>
  <div class="flex flex-col gap-4 m-4">
    <Field label={$t('name')} required>
      <Input bind:value={name} autofocus />
    </Field>
    <Field label={$t('description')}>
      <Textarea bind:value={description} />
    </Field>
    <Field label={$t('color')}>
      <ColorPicker value={color} onchange={(c) => (color = c)} />
    </Field>
  </div>
</FormModal>
```

**Step 2: Commit**

```bash
git add web/src/lib/modals/SpaceCreateModal.svelte
git commit -m "feat(web): add color picker to space create modal"
```

---

### Task 7: Web — Gradient Placeholder on Space Card

**Files:**

- Modify: `web/src/lib/components/spaces/space-card.svelte`

**Step 1: Add gradient map and replace empty state**

The space card needs a color-to-gradient mapping. Replace the gray placeholder `<div>` with a gradient.

Add this to the `<script>` section:

```typescript
import { UserAvatarColor } from '@immich/sdk';

const gradientClasses: Record<string, string> = {
  [UserAvatarColor.Primary]: 'from-immich-primary/60 to-immich-primary',
  [UserAvatarColor.Pink]: 'from-pink-300 to-pink-500',
  [UserAvatarColor.Red]: 'from-red-400 to-red-600',
  [UserAvatarColor.Yellow]: 'from-yellow-300 to-yellow-500',
  [UserAvatarColor.Blue]: 'from-blue-400 to-blue-600',
  [UserAvatarColor.Green]: 'from-green-400 to-green-700',
  [UserAvatarColor.Purple]: 'from-purple-400 to-purple-700',
  [UserAvatarColor.Orange]: 'from-orange-400 to-orange-600',
  [UserAvatarColor.Gray]: 'from-gray-400 to-gray-600',
  [UserAvatarColor.Amber]: 'from-amber-400 to-amber-600',
};

let gradientClass = $derived(gradientClasses[space.color ?? 'primary'] ?? gradientClasses[UserAvatarColor.Primary]);
```

Replace the empty state block (the `{:else}` after the thumbnail check):

```svelte
{:else}
  <div
    class="flex size-full items-center justify-center rounded-xl bg-gradient-to-br {gradientClass} aspect-square"
    data-testid="space-no-cover"
  >
    <Icon icon={mdiImageMultipleOutline} size="4em" class="text-white/40" />
  </div>
{/if}
```

**Step 2: Commit**

```bash
git add web/src/lib/components/spaces/space-card.svelte
git commit -m "feat(web): gradient placeholder on space card using space color"
```

---

### Task 8: Web — Stat Chips on Space Detail Page

**Files:**

- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`

**Step 1: Add icon imports**

Add to existing icon imports:

```typescript
import { mdiCameraOutline } from '@mdi/js';
```

`mdiAccountMultipleOutline` is already imported.

**Step 2: Replace plain stats with chips**

Replace the existing stats `<div>`:

```svelte
<div class="flex gap-4 mt-2 text-sm text-immich-fg/60 dark:text-immich-dark-fg/60">
  <span>{space.assetCount ?? 0} {$t('photos')}</span>
  <span>{members.length} {$t('members')}</span>
</div>
```

With:

```svelte
<div class="flex flex-wrap gap-2 mt-2">
  <span
    class="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300"
  >
    <Icon icon={mdiCameraOutline} size="16" />
    {space.assetCount ?? 0} {$t('photos')}
  </span>
  <span
    class="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300"
  >
    <Icon icon={mdiAccountMultipleOutline} size="16" />
    {members.length} {$t('members')}
  </span>
</div>
```

**Step 3: Commit**

```bash
git add web/src/routes/\(user\)/spaces/\[spaceId\]/\[\[photos=photos\]\]/\[\[assetId=id\]\]/+page.svelte
git commit -m "feat(web): add stat chips to space detail page"
```

---

### Task 9: Web — Role Badge Component and Integration

**Files:**

- Create: `web/src/lib/components/spaces/role-badge.svelte`
- Modify: `web/src/lib/modals/SpaceMembersModal.svelte`
- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`

**Step 1: Create role badge component**

```svelte
<script lang="ts">
  import type { UserAvatarColor } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  interface Props {
    role: string;
    spaceColor?: UserAvatarColor | string | null;
    size?: 'sm' | 'md';
  }

  let { role, spaceColor = 'primary', size = 'md' }: Props = $props();

  const colorMap: Record<string, { filled: string; outlined: string }> = {
    primary: { filled: 'bg-primary text-white', outlined: 'border-primary text-primary' },
    pink: { filled: 'bg-pink-400 text-white', outlined: 'border-pink-400 text-pink-400' },
    red: { filled: 'bg-red-500 text-white', outlined: 'border-red-500 text-red-500' },
    yellow: { filled: 'bg-yellow-500 text-white', outlined: 'border-yellow-500 text-yellow-600' },
    blue: { filled: 'bg-blue-500 text-white', outlined: 'border-blue-500 text-blue-500' },
    green: { filled: 'bg-green-600 text-white', outlined: 'border-green-600 text-green-600' },
    purple: { filled: 'bg-purple-600 text-white', outlined: 'border-purple-600 text-purple-600' },
    orange: { filled: 'bg-orange-600 text-white', outlined: 'border-orange-600 text-orange-600' },
    gray: { filled: 'bg-gray-600 text-white', outlined: 'border-gray-600 text-gray-600' },
    amber: { filled: 'bg-amber-600 text-white', outlined: 'border-amber-600 text-amber-600' },
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
  };

  let colors = $derived(colorMap[spaceColor ?? 'primary'] ?? colorMap.primary);
  let badgeClass = $derived.by(() => {
    if (role === 'owner') {
      return `${colors.filled} ${sizeClasses[size]}`;
    }
    if (role === 'editor') {
      return `border ${colors.outlined} ${sizeClasses[size]}`;
    }
    return `bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 ${sizeClasses[size]}`;
  });

  const roleLabel = $derived(
    role === 'owner' ? $t('owner') : role === 'editor' ? $t('role_editor') : $t('role_viewer'),
  );
</script>

<span
  class="inline-flex items-center rounded-full font-medium capitalize {badgeClass}"
  data-testid="role-badge-{role}"
>
  {roleLabel}
</span>
```

**Step 2: Update SpaceMembersModal**

In `web/src/lib/modals/SpaceMembersModal.svelte`:

1. Add `spaceColor` prop:

```typescript
interface Props {
  spaceId: string;
  members: SharedSpaceMemberResponseDto[];
  isOwner: boolean;
  spaceColor?: string | null;
  onClose: (updatedMembers?: SharedSpaceMemberResponseDto[]) => void;
}

let { spaceId, members: initialMembers, isOwner, spaceColor = 'primary', onClose }: Props = $props();
```

2. Import `RoleBadge`:

```typescript
import RoleBadge from '$lib/components/spaces/role-badge.svelte';
```

3. Replace the owner's disabled dropdown and the non-owner static text with `RoleBadge`. For the owner row:

```svelte
{#if isOwner && member.role === 'owner'}
  <RoleBadge role="owner" {spaceColor} />
```

For non-owner viewing another member's role:

```svelte
{:else if !isOwner}
  <RoleBadge role={member.role} {spaceColor} />
{/if}
```

Keep the `Select` dropdown as-is for owners viewing non-owner members.

**Step 3: Update space detail page — pass spaceColor to modal**

In the `handleShowMembers` function:

```typescript
const updatedMembers = await modalManager.show(SpaceMembersModal, {
  spaceId: space.id,
  members,
  isOwner,
  spaceColor: space.color,
});
```

**Step 4: Add role badge to space detail header**

After the stat chips `<div>`, add:

```svelte
{#if currentMember}
  <div class="mt-2">
    <RoleBadge role={currentMember.role} spaceColor={space.color} />
  </div>
{/if}
```

Import `RoleBadge`:

```typescript
import RoleBadge from '$lib/components/spaces/role-badge.svelte';
```

**Step 5: Commit**

```bash
git add web/src/lib/components/spaces/role-badge.svelte web/src/lib/modals/SpaceMembersModal.svelte web/src/routes/\(user\)/spaces/\[spaceId\]/\[\[photos=photos\]\]/\[\[assetId=id\]\]/+page.svelte
git commit -m "feat(web): add role badges to space detail page and members modal"
```

---

### Task 10: Server Unit Tests — Comprehensive coverage for color field

**Files:**

- Modify: `server/src/services/shared-space.service.spec.ts`

This task adds additional edge case tests beyond the basic ones in Task 3.

**Step 1: Write additional tests**

Add to the existing test file:

```typescript
// In 'create' describe
it('should create space with color set to primary by default when no color specified', async () => {
  const auth = factory.auth();
  const space = factory.sharedSpace({ createdById: auth.user.id });

  mocks.sharedSpace.create.mockResolvedValue(space);
  mocks.sharedSpace.addMember.mockResolvedValue(
    factory.sharedSpaceMember({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Owner }),
  );

  await sut.create(auth, { name: 'No Color Space' });

  expect(mocks.sharedSpace.create).toHaveBeenCalledWith(expect.objectContaining({ color: 'primary' }));
});

// In 'update' describe
it('should treat color update as metadata change (owner-only)', async () => {
  const auth = factory.auth();
  const space = factory.sharedSpace();
  const viewer = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Viewer });

  mocks.sharedSpace.getMember.mockResolvedValue(viewer);

  await expect(sut.update(auth, space.id, { color: UserAvatarColor.Red })).rejects.toBeInstanceOf(ForbiddenException);
});

// In 'getAll' describe
it('should return null color when space has no color set', async () => {
  const auth = factory.auth();
  const space = factory.sharedSpace({ color: null });

  mocks.sharedSpace.getAllByUserId.mockResolvedValue([space]);
  mocks.sharedSpace.getMembers.mockResolvedValue([]);
  mocks.sharedSpace.getAssetCount.mockResolvedValue(0);

  const result = await sut.getAll(auth);

  expect(result[0].color).toBeNull();
});
```

**Step 2: Run all shared space tests**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

Expected: ALL PASS

**Step 3: Commit**

```bash
git add server/src/services/shared-space.service.spec.ts
git commit -m "test(server): add comprehensive color field coverage for shared spaces"
```

---

### Task 11: Lint, Format, Type Check

**Files:** All modified files

**Step 1: Format server**

```bash
make format-server
```

**Step 2: Lint server**

```bash
make lint-server
```

**Step 3: Type check server**

```bash
make check-server
```

**Step 4: Format web**

```bash
make format-web
```

**Step 5: Lint web**

```bash
make lint-web
```

**Step 6: Type check web**

```bash
make check-web
```

**Step 7: Fix any issues and commit**

```bash
git add -u
git commit -m "chore: fix lint and formatting issues"
```

---

### Task 12: Run full server test suite

**Step 1: Run all server unit tests**

```bash
cd server && pnpm test -- --run
```

Expected: All 3100+ tests pass

**Step 2: If any tests fail, fix them**

Common issues:

- The existing `update` tests may need `color: undefined` added to `toHaveBeenCalledWith` expectations
- Factory changes may affect other test files

**Step 3: Commit any fixes**

```bash
git add -u
git commit -m "fix(server): update existing tests for color field"
```
