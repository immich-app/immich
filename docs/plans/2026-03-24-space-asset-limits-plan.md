# Space Asset Add Limit — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Limit the number of assets that can be added/removed from a shared space in a single request to 10,000, with server-side validation and a frontend warning.

**Architecture:** Add `@ArrayMaxSize(10_000)` to both add and remove DTOs for server-side enforcement. On the frontend, disable the "Add" button and show a red warning when selection exceeds the limit.

**Tech Stack:** class-validator (server), Svelte 5 (web), vitest + @testing-library/svelte (tests)

---

### Task 1: Write DTO Validation Tests

**Files:**

- Create: `server/src/dtos/shared-space.dto.spec.ts`
- Reference: `server/src/dtos/shared-space.dto.ts:216-224`
- Pattern: `server/src/dtos/user.dto.spec.ts` (existing DTO test)

**Step 1: Write the failing tests**

Create `server/src/dtos/shared-space.dto.spec.ts`:

```typescript
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SharedSpaceAssetAddDto, SharedSpaceAssetRemoveDto } from 'src/dtos/shared-space.dto';

// Generates valid v4 UUIDs by varying the last 12 hex chars
const makeUUIDs = (count: number) =>
  Array.from({ length: count }, (_, i) => {
    const hex = i.toString(16).padStart(12, '0');
    return `3fe388e4-2078-44d7-b36c-${hex}`;
  });

describe('SharedSpaceAssetAddDto', () => {
  it('should accept an empty array', async () => {
    const dto = plainToInstance(SharedSpaceAssetAddDto, { assetIds: [] });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept a single asset ID', async () => {
    const dto = plainToInstance(SharedSpaceAssetAddDto, { assetIds: makeUUIDs(1) });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept 9,999 asset IDs', async () => {
    const dto = plainToInstance(SharedSpaceAssetAddDto, { assetIds: makeUUIDs(9_999) });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept exactly 10,000 asset IDs', async () => {
    const dto = plainToInstance(SharedSpaceAssetAddDto, { assetIds: makeUUIDs(10_000) });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should reject 10,001 asset IDs', async () => {
    const dto = plainToInstance(SharedSpaceAssetAddDto, { assetIds: makeUUIDs(10_001) });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('SharedSpaceAssetRemoveDto', () => {
  it('should accept exactly 10,000 asset IDs', async () => {
    const dto = plainToInstance(SharedSpaceAssetRemoveDto, { assetIds: makeUUIDs(10_000) });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should reject 10,001 asset IDs', async () => {
    const dto = plainToInstance(SharedSpaceAssetRemoveDto, { assetIds: makeUUIDs(10_001) });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
```

Note: Empty arrays are intentionally allowed — the service already has an early return for `assetIds.length === 0`. Adding `@ArrayMinSize(1)` is not needed.

**Step 2: Run tests to verify they fail**

Run: `cd server && pnpm test -- --run src/dtos/shared-space.dto.spec.ts`

Expected: The "should reject" tests FAIL (no `@ArrayMaxSize` yet, so validation passes for any array size).

**Step 3: Commit the failing tests**

```bash
git add server/src/dtos/shared-space.dto.spec.ts
git commit -m "test: add DTO validation tests for space asset limits"
```

---

### Task 2: Implement Server-Side Limit

**Files:**

- Modify: `server/src/dtos/shared-space.dto.ts:216-224`

**Step 1: Add the ArrayMaxSize decorator**

In `server/src/dtos/shared-space.dto.ts`, add the import and decorator:

```typescript
// Add to existing imports from 'class-validator':
import { ArrayMaxSize } from 'class-validator';
```

Then add the constant and decorators:

```typescript
export const MAX_SPACE_ASSETS_PER_REQUEST = 10_000;

export class SharedSpaceAssetAddDto {
  @ValidateUUID({ each: true, description: 'Asset IDs' })
  @ArrayMaxSize(MAX_SPACE_ASSETS_PER_REQUEST)
  assetIds!: string[];
}

export class SharedSpaceAssetRemoveDto {
  @ValidateUUID({ each: true, description: 'Asset IDs' })
  @ArrayMaxSize(MAX_SPACE_ASSETS_PER_REQUEST)
  assetIds!: string[];
}
```

**Step 2: Run the tests**

Run: `cd server && pnpm test -- --run src/dtos/shared-space.dto.spec.ts`

Expected: All 7 tests PASS.

**Step 3: Run lint and format**

Run: `cd server && npx prettier --write src/dtos/shared-space.dto.ts src/dtos/shared-space.dto.spec.ts && npx eslint --fix src/dtos/shared-space.dto.ts src/dtos/shared-space.dto.spec.ts`

**Step 4: Commit**

```bash
git add server/src/dtos/shared-space.dto.ts server/src/dtos/shared-space.dto.spec.ts
git commit -m "feat: add 10,000 asset limit to shared space add/remove DTOs"
```

---

### Task 3: Add i18n Key

**Files:**

- Modify: `i18n/en.json`

**Step 1: Add the warning message key**

Add to `i18n/en.json` (alphabetical placement):

```json
"space_asset_limit_warning": "Import your photos as an external library or use the Add All Photos background job. See the <link>documentation</link> for more info."
```

The `<link>` tag is rendered by the `FormatMessage` Svelte component (at `web/src/lib/elements/FormatMessage.svelte`), which parses ICU `<tag>` syntax and yields structured parts via a Svelte snippet. Do NOT use `$t()` for this — it does not support tag replacement.

**Step 2: Commit**

```bash
git add i18n/en.json
git commit -m "feat: add i18n key for space asset limit warning"
```

---

### Task 4: Write Frontend Warning Test

The space page is too complex to render in isolation (route data dependencies, SDK imports, etc.). Extract a small `space-asset-limit-warning.svelte` component that is independently testable.

**Files:**

- Create: `web/src/lib/components/spaces/space-asset-limit-warning.spec.ts`
- Reference: `web/src/lib/components/spaces/space-hero.spec.ts` (test patterns)

**Step 1: Write the failing tests**

Create `web/src/lib/components/spaces/space-asset-limit-warning.spec.ts`:

```typescript
import { render, screen } from '@testing-library/svelte';
import SpaceAssetLimitWarning from '$lib/components/spaces/space-asset-limit-warning.svelte';

describe('SpaceAssetLimitWarning', () => {
  it('should not render when selectedCount is within the limit', () => {
    render(SpaceAssetLimitWarning, { selectedCount: 5_000 });
    expect(screen.queryByTestId('asset-limit-warning')).not.toBeInTheDocument();
  });

  it('should not render when selectedCount is exactly at the limit', () => {
    render(SpaceAssetLimitWarning, { selectedCount: 10_000 });
    expect(screen.queryByTestId('asset-limit-warning')).not.toBeInTheDocument();
  });

  it('should render warning when selectedCount exceeds the limit', () => {
    render(SpaceAssetLimitWarning, { selectedCount: 10_001 });
    expect(screen.getByTestId('asset-limit-warning')).toBeInTheDocument();
  });

  it('should render warning when selectedCount is way over the limit', () => {
    render(SpaceAssetLimitWarning, { selectedCount: 100_000 });
    expect(screen.getByTestId('asset-limit-warning')).toBeInTheDocument();
  });

  it('should not render when selectedCount is 0', () => {
    render(SpaceAssetLimitWarning, { selectedCount: 0 });
    expect(screen.queryByTestId('asset-limit-warning')).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && pnpm test -- --run src/lib/components/spaces/space-asset-limit-warning.spec.ts`

Expected: FAIL (component doesn't exist yet).

**Step 3: Commit the failing test**

```bash
git add web/src/lib/components/spaces/space-asset-limit-warning.spec.ts
git commit -m "test: add space asset limit warning component tests"
```

---

### Task 5: Implement Frontend Warning Component

**Files:**

- Create: `web/src/lib/components/spaces/space-asset-limit-warning.svelte`
- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`

**Step 1: Create the SpaceAssetLimitWarning component**

Create `web/src/lib/components/spaces/space-asset-limit-warning.svelte`:

```svelte
<script lang="ts">
  import FormatMessage from '$lib/elements/FormatMessage.svelte';

  interface Props {
    selectedCount: number;
  }

  export const MAX_SPACE_ASSETS_PER_REQUEST = 10_000;

  let { selectedCount }: Props = $props();
</script>

{#if selectedCount > MAX_SPACE_ASSETS_PER_REQUEST}
  <div
    class="mx-4 mt-2 rounded-lg bg-red-100 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200"
    data-testid="asset-limit-warning"
  >
    <FormatMessage key="space_asset_limit_warning">
      {#snippet children({ tag, message })}
        {#if tag === 'link'}
          <a
            href="https://github.com/open-noodle/gallery/blob/main/docs/docs/features/shared-spaces.md#got-a-lot-of-photos"
            class="underline"
            target="_blank"
            rel="noopener">{message}</a
          >
        {/if}
      {/snippet}
    </FormatMessage>
  </div>
{/if}
```

**Step 2: Run the tests**

Run: `cd web && pnpm test -- --run src/lib/components/spaces/space-asset-limit-warning.spec.ts`

Expected: All 5 tests PASS.

**Step 3: Integrate into the space page**

In `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`:

1. Import the component and constant:

```typescript
import SpaceAssetLimitWarning, {
  MAX_SPACE_ASSETS_PER_REQUEST,
} from '$lib/components/spaces/space-asset-limit-warning.svelte';
```

2. In the `handleAddAssets` function, add an early return guard (defense in depth — button is disabled, but prevents programmatic calls):

```typescript
const handleAddAssets = async () => {
  const assetIds = timelineInteraction.selectedAssets.map((a) => a.id);
  if (assetIds.length === 0 || assetIds.length > MAX_SPACE_ASSETS_PER_REQUEST) {
    return;
  }
  // ... rest unchanged
};
```

3. In the selection control bar (around line 885), disable the add button when over limit:

```svelte
disabled={!timelineInteraction.selectionActive || timelineInteraction.selectedAssets.length > MAX_SPACE_ASSETS_PER_REQUEST}
```

4. After the `</ControlAppBar>` closing tag, add:

```svelte
<SpaceAssetLimitWarning selectedCount={timelineInteraction.selectedAssets.length} />
```

**Step 4: Run lint and format**

Run: `cd web && npx prettier --write src/lib/components/spaces/space-asset-limit-warning.svelte "src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte"`

**Step 5: Commit**

```bash
git add web/src/lib/components/spaces/space-asset-limit-warning.svelte "web/src/routes/(user)/spaces/"
git commit -m "feat: show warning and disable add button when space asset limit exceeded"
```

---

### Task 6: Regenerate OpenAPI Spec

The `@ArrayMaxSize` decorator is reflected in the OpenAPI spec as `maxItems`. Regenerate to keep specs in sync.

**Step 1: Regenerate**

Run: `cd server && pnpm build && pnpm sync:open-api && cd .. && make open-api`

**Step 2: Verify the spec includes maxItems**

Check `open-api/immich-openapi-specs.json` for `SharedSpaceAssetAddDto` — it should now have `"maxItems": 10000` on the `assetIds` array.

**Step 3: Commit**

```bash
git add open-api/ mobile/openapi/
git commit -m "chore: regenerate OpenAPI specs with asset limit maxItems"
```

---

### Task 7: Final Verification

**Step 1: Run all server tests**

Run: `cd server && pnpm test`

**Step 2: Run all web tests**

Run: `cd web && pnpm test`

**Step 3: Run lint and format checks**

Run: `make check-server && make check-web && make lint-server && make lint-web`
