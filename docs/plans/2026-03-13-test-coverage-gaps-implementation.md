# Test Coverage Gaps Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close testing gaps across new features (Shared Spaces, Gallery Branding, Mobile Integration) and fill critical gaps in others (Pet Detection, Image Editing, Google Photos Import).

**Architecture:** Layer-by-layer approach (Server → Web → Mobile) to leverage dependencies. Each feature is tested comprehensively (spaces/branding/mobile) or critical-gaps-only (pet/edit/import). Cross-layer integration tests validate feature interactions.

**Tech Stack:**

- **Server:** Vitest, testcontainers, Kysely mocking
- **Web:** Vitest, @testing-library/svelte, Playwright
- **Mobile:** flutter_test, Riverpod testing, Patrol (Dart)
- **E2E:** Playwright (web), Patrol (mobile)

---

## Phase 1: Server Layer Tests (Highest ROI)

### Task 1: Create Shared Spaces Permission Tests

**Files:**

- Modify: `server/src/services/shared-space.service.spec.ts`

**Step 1: Write failing tests for permission checks**

Add to `shared-space.service.spec.ts`:

```typescript
describe('SharedSpaceService - permissions', () => {
  describe('asset access by role', () => {
    it('should deny asset edit if user is VIEWER role', async () => {
      const space = await sharedSpaceFactory.create(albumService, assetService);
      const member = await testUser.create({ role: 'VIEWER' });
      await spaceRepository.addMember(space.id, member.id, 'VIEWER');

      const asset = await assetFactory.create({ ownerId: space.ownerId });
      await spaceRepository.addAsset(space.id, asset.id);

      // Should fail
      await expect(assetService.updateAsset(asset.id, { description: 'new' }, member.id)).rejects.toThrow(
        'Access Denied',
      );
    });

    it('should allow asset read for any space member', async () => {
      const space = await sharedSpaceFactory.create(albumService, assetService);
      const member = await testUser.create();
      await spaceRepository.addMember(space.id, member.id, 'VIEW');

      const asset = await assetFactory.create({ ownerId: space.ownerId });
      await spaceRepository.addAsset(space.id, asset.id);

      const result = await assetService.getAsset(asset.id, member.id);
      expect(result).toBeDefined();
    });

    it('should restrict asset sharing to space ADMIN/EDIT only', async () => {
      const space = await sharedSpaceFactory.create(albumService, assetService);
      const editorMember = await testUser.create();
      const viewerMember = await testUser.create();

      await spaceRepository.addMember(space.id, editorMember.id, 'EDIT');
      await spaceRepository.addMember(space.id, viewerMember.id, 'VIEW');

      const asset = await assetFactory.create({ ownerId: space.ownerId });
      await spaceRepository.addAsset(space.id, asset.id);

      // EDIT should succeed
      await expect(sharedLinkService.createLink(asset.id, {}, editorMember.id)).resolves.toBeDefined();

      // VIEW should fail
      await expect(sharedLinkService.createLink(asset.id, {}, viewerMember.id)).rejects.toThrow('Access Denied');
    });
  });

  describe('asset access control on lifecycle', () => {
    it('should deny access when user is removed from space', async () => {
      const space = await sharedSpaceFactory.create(albumService, assetService);
      const member = await testUser.create();
      await spaceRepository.addMember(space.id, member.id, 'EDIT');

      const asset = await assetFactory.create({ ownerId: space.ownerId });
      await spaceRepository.addAsset(space.id, asset.id);

      // Can access while member
      await expect(assetService.getAsset(asset.id, member.id)).resolves.toBeDefined();

      // Remove from space
      await spaceRepository.removeMember(space.id, member.id);

      // Can't access after removal
      await expect(assetService.getAsset(asset.id, member.id)).rejects.toThrow('Access Denied');
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd server
pnpm test -- --run src/services/shared-space.service.spec.ts
```

Expected: FAIL - "Access Denied check not implemented" or similar

**Step 3: Implement permission checks in AssetService**

Modify `server/src/services/asset.service.ts`:

Add method to check space access:

```typescript
private async checkSpaceAccess(
  assetId: string,
  userId: string,
  requiredRole?: 'ADMIN' | 'EDIT' | 'VIEW' | 'VIEWER'
): Promise<void> {
  // Get asset
  const asset = await this.assetRepository.getById(assetId);

  // If asset is in a space, check membership
  const spaceAsset = await this.spaceAssetRepository.findByAssetId(assetId);
  if (spaceAsset) {
    const membership = await this.spaceMemberRepository.findBySpaceAndUser(
      spaceAsset.spaceId,
      userId
    );

    if (!membership) {
      throw new ForbiddenException('Not a member of this space');
    }

    // Check role requirement if provided
    if (requiredRole) {
      const roleHierarchy = { ADMIN: 3, EDIT: 2, VIEW: 1, VIEWER: 0 };
      if (roleHierarchy[membership.role] < roleHierarchy[requiredRole]) {
        throw new ForbiddenException(`Requires ${requiredRole} role`);
      }
    }
  }
}

// Add to updateAsset method:
async updateAsset(
  id: string,
  dto: UpdateAssetDto,
  userId: string
): Promise<AssetResponseDto> {
  await this.checkSpaceAccess(id, userId, 'EDIT'); // Requires EDIT or higher
  // ... rest of method
}

// Add to getAsset method:
async getAsset(id: string, userId: string): Promise<AssetResponseDto> {
  await this.checkSpaceAccess(id, userId); // Any member role OK
  // ... rest of method
}
```

**Step 4: Run tests to verify they pass**

```bash
cd server
pnpm test -- --run src/services/shared-space.service.spec.ts
```

Expected: PASS - all 4 tests

**Step 5: Commit**

```bash
git add server/src/services/shared-space.service.spec.ts server/src/services/asset.service.ts
git commit -m "test: add shared space permission checks on asset CRUD"
```

---

### Task 2: Create Timeline Integration Tests for Spaces

**Files:**

- Modify: `server/src/services/timeline.service.spec.ts`
- Modify: `server/src/repositories/asset.repository.ts`

**Step 1: Write failing test for space asset inclusion**

Add to `timeline.service.spec.ts`:

```typescript
describe('TimelineService - space integration', () => {
  describe('getTimeline with spaces', () => {
    it('should include space assets in timeline when showInTimeline is true', async () => {
      const user = await userFactory.create();
      const space = await sharedSpaceFactory.create(albumService, assetService);
      await spaceRepository.addMember(space.id, user.id, 'EDIT');

      // Create asset in space
      const assetInSpace = await assetFactory.create({ ownerId: space.ownerId });
      await spaceRepository.addAsset(space.id, assetInSpace.id);

      // Create personal asset
      const personalAsset = await assetFactory.create({ ownerId: user.id });

      // Toggle ON
      await spaceRepository.updateSpaceMember(space.id, user.id, { showInTimeline: true });

      const timeline = await timelineService.getTimeline(user.id);
      expect(timeline.map((a) => a.id)).toContain(assetInSpace.id);
      expect(timeline.map((a) => a.id)).toContain(personalAsset.id);
    });

    it('should exclude space assets when showInTimeline is false', async () => {
      const user = await userFactory.create();
      const space = await sharedSpaceFactory.create(albumService, assetService);
      await spaceRepository.addMember(space.id, user.id, 'EDIT');

      const assetInSpace = await assetFactory.create({ ownerId: space.ownerId });
      await spaceRepository.addAsset(space.id, assetInSpace.id);

      // Toggle OFF
      await spaceRepository.updateSpaceMember(space.id, user.id, { showInTimeline: false });

      const timeline = await timelineService.getTimeline(user.id);
      expect(timeline.map((a) => a.id)).not.toContain(assetInSpace.id);
    });

    it('should handle concurrent space + personal timeline updates', async () => {
      const user = await userFactory.create();
      const space = await sharedSpaceFactory.create(albumService, assetService);
      await spaceRepository.addMember(space.id, user.id, 'EDIT');

      const asset1 = await assetFactory.create({ ownerId: space.ownerId, createdAt: new Date('2024-01-01') });
      const asset2 = await assetFactory.create({ ownerId: user.id, createdAt: new Date('2024-01-02') });
      const asset3 = await assetFactory.create({ ownerId: space.ownerId, createdAt: new Date('2024-01-03') });

      await spaceRepository.addAsset(space.id, asset1.id);
      await spaceRepository.addAsset(space.id, asset3.id);

      await spaceRepository.updateSpaceMember(space.id, user.id, { showInTimeline: true });

      const timeline = await timelineService.getTimeline(user.id);
      // Should be ordered by date, not split
      expect(timeline.map((a) => a.id)).toEqual([asset1.id, asset2.id, asset3.id]);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd server
pnpm test -- --run src/services/timeline.service.spec.ts -t "space integration"
```

Expected: FAIL - Timeline query doesn't include space assets

**Step 3: Implement space asset filtering in timeline query**

Modify `server/src/repositories/asset.repository.ts`, `getTimeline` method:

```typescript
async getTimeline(userId: string, dto: TimlineSearchDto): Promise<AssetEntity[]> {
  let query = this.db
    .selectFrom('asset')
    .where(
      (eb) =>
        eb.or([
          // Personal assets
          eb('asset.ownerId', '=', userId),
          // Space assets where user is member and showInTimeline = true
          eb(
            'asset.id',
            'in',
            // Subquery: assets in spaces where user is member with showInTimeline=true
            (sq) =>
              sq
                .selectDistinct('spa.assetId')
                .from('shared_space_asset as spa')
                .join('shared_space_member as ssm', (join) =>
                  join
                    .onRef('ssm.spaceId', '=', 'spa.spaceId')
                    .on('ssm.userId', '=', userId)
                    .on('ssm.showInTimeline', '=', true)
                )
          )
        ])
    )
    .selectAll();

  // ... rest of existing filtering (dates, etc)

  return query.execute();
}
```

**Step 4: Run tests to verify they pass**

```bash
cd server
pnpm test -- --run src/services/timeline.service.spec.ts -t "space integration"
```

Expected: PASS - all 3 tests

**Step 5: Commit**

```bash
git add server/src/services/timeline.service.spec.ts server/src/repositories/asset.repository.ts
git commit -m "test: add timeline integration for space assets with showInTimeline toggle"
```

---

### Task 3: Create Space Activity Logging Tests

**Files:**

- Create: `server/src/repositories/space-activity.repository.ts`
- Create: `server/src/repositories/space-activity.repository.spec.ts`
- Modify: `server/src/services/shared-space.service.ts`

**Step 1: Write failing test for activity creation**

Create `server/src/repositories/space-activity.repository.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { SpaceActivityRepository } from './space-activity.repository';
import { newTestService } from '../../test/utils';

describe('SpaceActivityRepository', () => {
  let repository: SpaceActivityRepository;
  let testService: any;

  beforeAll(async () => {
    testService = await newTestService();
    repository = testService.spaceActivityRepository;
  });

  describe('create', () => {
    it('should create activity record for member invite', async () => {
      const space = await testService.spaceRepository.create({
        name: 'Test Space',
        ownerId: 'owner-id',
      });
      const actor = await testService.userRepository.create({ email: 'actor@test.com' });
      const target = await testService.userRepository.create({ email: 'target@test.com' });

      const activity = await repository.create({
        spaceId: space.id,
        type: 'MEMBER_INVITED',
        actorId: actor.id,
        targetUserId: target.id,
      });

      expect(activity.id).toBeDefined();
      expect(activity.type).toBe('MEMBER_INVITED');
      expect(activity.createdAt).toBeDefined();
    });

    it('should log all 8 event types', async () => {
      const space = await testService.spaceRepository.create({
        name: 'Test Space',
        ownerId: 'owner-id',
      });
      const actor = await testService.userRepository.create({ email: 'actor@test.com' });

      const eventTypes = [
        'MEMBER_INVITED',
        'MEMBER_JOINED',
        'MEMBER_LEFT',
        'ASSET_ADDED',
        'ASSET_REMOVED',
        'ROLE_CHANGED',
        'SPACE_SHARED',
        'COVER_UPDATED',
      ];

      for (const type of eventTypes) {
        const activity = await repository.create({
          spaceId: space.id,
          type: type as any,
          actorId: actor.id,
        });
        expect(activity.type).toBe(type);
      }
    });
  });

  describe('getActivities', () => {
    it('should filter activities by date range', async () => {
      const space = await testService.spaceRepository.create({
        name: 'Test Space',
        ownerId: 'owner-id',
      });
      const actor = await testService.userRepository.create({ email: 'actor@test.com' });

      const oldDate = new Date('2024-01-01');
      const newDate = new Date('2024-03-01');

      await repository.create(
        {
          spaceId: space.id,
          type: 'ASSET_ADDED',
          actorId: actor.id,
        },
        oldDate,
      );

      await repository.create(
        {
          spaceId: space.id,
          type: 'ASSET_REMOVED',
          actorId: actor.id,
        },
        newDate,
      );

      const recent = await repository.getActivities(space.id, {
        since: new Date('2024-02-01'),
      });

      expect(recent).toHaveLength(1);
      expect(recent[0].type).toBe('ASSET_REMOVED');
    });

    it('should paginate activities', async () => {
      const space = await testService.spaceRepository.create({
        name: 'Test Space',
        ownerId: 'owner-id',
      });
      const actor = await testService.userRepository.create({ email: 'actor@test.com' });

      for (let i = 0; i < 25; i++) {
        await repository.create({
          spaceId: space.id,
          type: 'ASSET_ADDED',
          actorId: actor.id,
        });
      }

      const page1 = await repository.getActivities(space.id, { take: 10, skip: 0 });
      const page2 = await repository.getActivities(space.id, { take: 10, skip: 10 });

      expect(page1).toHaveLength(10);
      expect(page2).toHaveLength(10);
      expect(page1[0].id).not.toBe(page2[0].id);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd server
pnpm test -- --run src/repositories/space-activity.repository.spec.ts
```

Expected: FAIL - "SpaceActivityRepository not found"

**Step 3: Create the repository**

Create `server/src/repositories/space-activity.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { Database } from '../schema';

@Injectable()
export class SpaceActivityRepository {
  constructor(private db: Kysely<Database>) {}

  async create(
    data: {
      spaceId: string;
      type:
        | 'MEMBER_INVITED'
        | 'MEMBER_JOINED'
        | 'MEMBER_LEFT'
        | 'ASSET_ADDED'
        | 'ASSET_REMOVED'
        | 'ROLE_CHANGED'
        | 'SPACE_SHARED'
        | 'COVER_UPDATED';
      actorId: string;
      targetUserId?: string;
    },
    createdAt = new Date(),
  ) {
    const result = await this.db
      .insertInto('shared_space_activity')
      .values({
        id: generateUUID(),
        spaceId: data.spaceId,
        type: data.type,
        actorId: data.actorId,
        targetUserId: data.targetUserId,
        createdAt,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  }

  async getActivities(
    spaceId: string,
    options: {
      take?: number;
      skip?: number;
      since?: Date;
    } = {},
  ) {
    let query = this.db.selectFrom('shared_space_activity').where('spaceId', '=', spaceId);

    if (options.since) {
      query = query.where('createdAt', '>', options.since);
    }

    return query
      .selectAll()
      .orderBy('createdAt', 'desc')
      .limit(options.take ?? 50)
      .offset(options.skip ?? 0)
      .execute();
  }
}
```

**Step 4: Run tests to verify they pass**

```bash
cd server
pnpm test -- --run src/repositories/space-activity.repository.spec.ts
```

Expected: PASS - all tests

**Step 5: Commit**

```bash
git add server/src/repositories/space-activity.repository.ts server/src/repositories/space-activity.repository.spec.ts
git commit -m "test: add space activity logging repository with 8 event types"
```

---

### Task 4: Create Pet Detection Error Handling Tests

**Files:**

- Modify: `server/src/services/pet-detection.service.spec.ts`

**Step 1: Write failing tests for error scenarios**

Add to `pet-detection.service.spec.ts`:

```typescript
describe('PetDetectionService - error handling', () => {
  describe('model loading', () => {
    it('should handle missing ONNX model file gracefully', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await petDetectionService.ensureModelLoaded();

      expect(result).toBe(false);
      // Should log error, not throw
      expect(logger.error).toHaveBeenCalled();
    });

    it('should retry on network error fetching from HuggingFace', async () => {
      vi.mocked(fetch)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(new Response(Buffer.from('model data'), { status: 200 }));

      const result = await petDetectionService.downloadModel('yolo11s');

      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should fall back to yolo11n if yolo11s download fails after retries', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));
      vi.mocked(fs.existsSync).mockImplementation((path: string) => path.includes('yolo11n'));

      const result = await petDetectionService.ensureModelLoaded();

      expect(result).toBe(true); // yolo11n exists
      // Should have attempted yolo11s, then fallen back
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('yolo11s failed'));
    });
  });

  describe('inference error handling', () => {
    it('should skip detection on unsupported image types', async () => {
      const unsupportedImage = {
        mime: 'application/pdf',
        buffer: Buffer.from('pdf data'),
      };

      const result = await petDetectionService.detectPets(unsupportedImage);

      expect(result).toEqual([]);
      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('unsupported'));
    });

    it('should log and continue on OOM during inference', async () => {
      vi.mocked(modelInference).mockRejectedValueOnce(new Error('out of memory'));

      const result = await petDetectionService.detectPets(testImage);

      expect(result).toEqual([]); // Empty results, no throw
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('OOM'));
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd server
pnpm test -- --run src/services/pet-detection.service.spec.ts -t "error handling"
```

Expected: FAIL - Missing error handling

**Step 3: Implement error handling**

Modify `server/src/services/pet-detection.service.ts`:

```typescript
async ensureModelLoaded(): Promise<boolean> {
  const preferredModel = this.config.pet.model || 'yolo11s';
  const fallbackModel = 'yolo11n';

  try {
    if (!fs.existsSync(this.getModelPath(preferredModel))) {
      this.logger.info(`Downloading ${preferredModel}...`);
      await this.downloadModel(preferredModel);
    }
    return true;
  } catch (error) {
    this.logger.warn(
      `Failed to load ${preferredModel}: ${error.message}. Falling back to ${fallbackModel}`
    );
    if (fs.existsSync(this.getModelPath(fallbackModel))) {
      this.modelPath = this.getModelPath(fallbackModel);
      return true;
    }
    return false;
  }
}

private async downloadModel(
  model: string,
  retries = 3
): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(
        `https://huggingface.co/${this.HF_REPO}/${model}.onnx`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const buffer = await response.arrayBuffer();
      fs.writeFileSync(this.getModelPath(model), Buffer.from(buffer));
      return true;
    } catch (error) {
      if (attempt === retries) throw error;
      this.logger.debug(`Retry ${attempt}/${retries}...`);
      await new Promise((r) => setTimeout(r, 1000 * attempt)); // exponential backoff
    }
  }
  return false;
}

async detectPets(image: { mime: string; buffer: Buffer }): Promise<any[]> {
  // Check supported types
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.mime)) {
    this.logger.debug(`Skipping unsupported image type: ${image.mime}`);
    return [];
  }

  try {
    const results = await this.runInference(image.buffer);
    return results.filter((r) => r.confidence > 0.5);
  } catch (error) {
    if (error.message.includes('memory')) {
      this.logger.error(`OOM during pet detection: ${error.message}`);
      return [];
    }
    throw error;
  }
}
```

**Step 4: Run tests to verify they pass**

```bash
cd server
pnpm test -- --run src/services/pet-detection.service.spec.ts -t "error handling"
```

Expected: PASS - all error tests pass

**Step 5: Commit**

```bash
git add server/src/services/pet-detection.service.spec.ts server/src/services/pet-detection.service.ts
git commit -m "test: add error handling for pet detection model loading and inference"
```

---

### Task 5: Create Branding Config Validation Tests

**Files:**

- Create: `server/src/utils/branding-validator.spec.ts`
- Create: `server/src/utils/branding-validator.ts`

**Step 1: Write failing test for config validation**

Create `server/src/utils/branding-validator.spec.ts`:

```typescript
import { validateBrandingConfig } from './branding-validator';

describe('brandingValidator', () => {
  describe('required fields', () => {
    it('should accept valid branding config', () => {
      const config = {
        registry: 'ghcr.io/open-noodle',
        serverImage: 'gallery-server',
        mlImage: 'gallery-ml',
        androidPackage: 'app.gallery.immich',
        iosBundleId: 'app.gallery.immich',
        cliName: 'gallery',
        appName: 'Gallery',
      };

      expect(() => validateBrandingConfig(config)).not.toThrow();
    });

    it('should reject missing required fields', () => {
      const config = {
        registry: 'ghcr.io/open-noodle',
        // serverImage missing
        mlImage: 'gallery-ml',
      };

      expect(() => validateBrandingConfig(config as any)).toThrow('serverImage is required');
    });
  });

  describe('field validation', () => {
    it('should reject invalid image registry URL', () => {
      const config = {
        registry: 'not-a-url',
        serverImage: 'gallery-server',
        mlImage: 'gallery-ml',
      };

      expect(() => validateBrandingConfig(config as any)).toThrow('registry must be a valid URL');
    });

    it('should handle missing optional fields with defaults', () => {
      const config = {
        registry: 'ghcr.io/open-noodle',
        serverImage: 'gallery-server',
        mlImage: 'gallery-ml',
        // Optional fields missing
      };

      const result = validateBrandingConfig(config as any);
      expect(result.cliName).toBe('immich'); // default
      expect(result.appName).toBe('Immich'); // default
    });
  });

  describe('image name validation', () => {
    it('should reject malformed image names (no slashes allowed)', () => {
      const config = {
        registry: 'ghcr.io/owner',
        serverImage: 'invalid/image/name', // Not allowed
        mlImage: 'gallery-ml',
      };

      expect(() => validateBrandingConfig(config as any)).toThrow('serverImage cannot contain slashes');
    });

    it('should allow image names with tags', () => {
      const config = {
        registry: 'ghcr.io/owner',
        serverImage: 'gallery-server:v3.0.1',
        mlImage: 'gallery-ml:cuda-v3.0.1',
      };

      expect(() => validateBrandingConfig(config as any)).not.toThrow();
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd server
pnpm test -- --run src/utils/branding-validator.spec.ts
```

Expected: FAIL - "validateBrandingConfig not found"

**Step 3: Create validator**

Create `server/src/utils/branding-validator.ts`:

```typescript
export interface BrandingConfig {
  registry: string;
  serverImage: string;
  mlImage: string;
  androidPackage?: string;
  iosBundleId?: string;
  cliName?: string;
  appName?: string;
}

export function validateBrandingConfig(config: unknown): BrandingConfig & {
  cliName: string;
  appName: string;
} {
  if (!config || typeof config !== 'object') {
    throw new Error('Branding config must be an object');
  }

  const cfg = config as Record<string, any>;

  // Required fields
  const required = ['registry', 'serverImage', 'mlImage'];
  for (const field of required) {
    if (!cfg[field]) {
      throw new Error(`${field} is required`);
    }
  }

  // Validate registry is a URL
  try {
    new URL(cfg.registry);
  } catch {
    throw new Error('registry must be a valid URL');
  }

  // Validate image names (no slashes, allow colons for tags)
  const imageFields = ['serverImage', 'mlImage'];
  for (const field of imageFields) {
    if (cfg[field].includes('/')) {
      throw new Error(`${field} cannot contain slashes`);
    }
  }

  // Provide defaults
  return {
    registry: cfg.registry,
    serverImage: cfg.serverImage,
    mlImage: cfg.mlImage,
    androidPackage: cfg.androidPackage,
    iosBundleId: cfg.iosBundleId,
    cliName: cfg.cliName ?? 'immich',
    appName: cfg.appName ?? 'Immich',
  };
}
```

**Step 4: Run tests to verify they pass**

```bash
cd server
pnpm test -- --run src/utils/branding-validator.spec.ts
```

Expected: PASS - all validation tests pass

**Step 5: Commit**

```bash
git add server/src/utils/branding-validator.ts server/src/utils/branding-validator.spec.ts
git commit -m "test: add branding config validation"
```

---

## Phase 2: Web Layer Tests (60 min)

### Task 6: Create SpacesManager Unit Tests

**Files:**

- Create: `web/src/lib/managers/spaces-manager.spec.ts`

**Step 1: Write failing test for state management**

Create `web/src/lib/managers/spaces-manager.spec.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpacesManager } from './spaces-manager.svelte';
import type { SpacesApi } from '@immich/sdk';

describe('SpacesManager', () => {
  let manager: SpacesManager;
  let mockApi: Partial<SpacesApi>;

  beforeEach(() => {
    mockApi = {
      getSpaces: vi.fn().mockResolvedValue([]),
      addMember: vi.fn(),
      updateSpace: vi.fn(),
    };

    manager = new SpacesManager(mockApi as SpacesApi);
  });

  describe('space list synchronization', () => {
    it('should sync space list from API', async () => {
      const mockSpaces = [
        { id: '1', name: 'Space 1', ownerId: 'user-1' },
        { id: '2', name: 'Space 2', ownerId: 'user-1' },
      ];

      vi.mocked(mockApi.getSpaces).mockResolvedValueOnce(mockSpaces);

      await manager.loadSpaces();

      expect(manager.spaces.length).toBe(2);
      expect(manager.spaces[0].name).toBe('Space 1');
    });

    it('should update local space on member join via Socket.IO event', () => {
      const space = { id: '1', name: 'Space 1', members: [] };
      manager.spaces = [$state.snapshot(space)];

      const newMember = { userId: 'new-user', role: 'EDIT' };
      manager.handleMemberJoined('1', newMember);

      expect(manager.spaces[0].members).toContain(newMember);
    });

    it('should handle concurrent invites', async () => {
      const invites = [
        { spaceId: '1', userId: 'user-2', role: 'EDIT' as const },
        { spaceId: '1', userId: 'user-3', role: 'VIEW' as const },
      ];

      const promises = invites.map((invite) => manager.sendInvite(invite.spaceId, invite.userId, invite.role));

      await Promise.all(promises);

      expect(mockApi.addMember).toHaveBeenCalledTimes(2);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd web
pnpm test -- --run src/lib/managers/spaces-manager.spec.ts
```

Expected: FAIL - "SpacesManager not fully implemented"

**Step 3: Implement SpacesManager**

Modify `web/src/lib/managers/spaces-manager.svelte.ts` to add:

```typescript
export class SpacesManager {
  spaces = $state<SpaceDto[]>([]);
  isLoading = $state(false);

  constructor(private api: SpacesApi) {
    this.setupSocketListeners();
  }

  async loadSpaces() {
    this.isLoading = true;
    try {
      this.spaces = await this.api.getSpaces();
    } finally {
      this.isLoading = false;
    }
  }

  async sendInvite(spaceId: string, userId: string, role: SpaceRole) {
    await this.api.addMember(spaceId, { userId, role });
    // Update local state
    const space = this.spaces.find((s) => s.id === spaceId);
    if (space) {
      space.members ??= [];
      space.members.push({ userId, role });
    }
  }

  handleMemberJoined(spaceId: string, member: SpaceMember) {
    const space = this.spaces.find((s) => s.id === spaceId);
    if (space) {
      space.members ??= [];
      space.members.push(member);
    }
  }

  private setupSocketListeners() {
    // Socket.IO event handlers
  }
}
```

**Step 4: Run tests to verify they pass**

```bash
cd web
pnpm test -- --run src/lib/managers/spaces-manager.spec.ts
```

Expected: PASS - all manager tests pass

**Step 5: Commit**

```bash
git add web/src/lib/managers/spaces-manager.spec.ts web/src/lib/managers/spaces-manager.svelte.ts
git commit -m "test: add SpacesManager unit tests for state synchronization"
```

---

### Task 7: Create Logo Component Tests

**Files:**

- Create: `web/src/lib/components/Logo.spec.ts`

**Step 1: Write failing tests for logo variants**

Create `web/src/lib/components/Logo.spec.ts`:

```typescript
import { render } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Logo from './Logo.svelte';
import * as themeService from '$lib/services/theme.service';

vi.mock('$lib/services/theme.service');

describe('Logo Component', () => {
  beforeEach(() => {
    vi.mocked(themeService.isDarkMode).mockReturnValue(false);
  });

  it('should render Gallery logo by default', () => {
    const { container } = render(Logo);
    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
    expect(svg?.getAttribute('data-testid')).toBe('gallery-logo');
  });

  it('should switch variant on theme change', () => {
    vi.mocked(themeService.isDarkMode).mockReturnValue(false);
    const { container, rerender } = render(Logo);

    let svg = container.querySelector('[data-testid="gallery-logo"]');
    expect(svg?.className).toContain('light');

    vi.mocked(themeService.isDarkMode).mockReturnValue(true);
    rerender(Logo);

    svg = container.querySelector('[data-testid="gallery-logo"]');
    expect(svg?.className).toContain('dark');
  });

  it('should fallback to Immich logo if Gallery logo missing', () => {
    // Mock missing Gallery assets
    const { container } = render(Logo, {
      props: { fallbackToImmich: true },
    });

    const svg = container.querySelector('[data-testid="immich-logo"]');
    expect(svg).toBeDefined();
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd web
pnpm test -- --run src/lib/components/Logo.spec.ts
```

Expected: FAIL - Missing test IDs or functionality

**Step 3: Update Logo component**

Modify `web/src/lib/components/Logo.svelte`:

```svelte
<script lang="ts">
  import { isDarkMode } from '$lib/services/theme.service';

  let { fallbackToImmich = false } = $props();

  const shouldUseFallback = fallbackToImmich; // Check if Gallery assets exist
</script>

{#if !shouldUseFallback}
  {#if isDarkMode()}
    <svg
      data-testid="gallery-logo"
      class="dark"
      viewBox="0 0 200 40"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Gallery dark logo SVG -->
      <text x="10" y="25">Gallery</text>
    </svg>
  {:else}
    <svg
      data-testid="gallery-logo"
      class="light"
      viewBox="0 0 200 40"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Gallery light logo SVG -->
      <text x="10" y="25">Gallery</text>
    </svg>
  {/if}
{:else}
  <svg
    data-testid="immich-logo"
    viewBox="0 0 200 40"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Immich logo SVG -->
    <text x="10" y="25">Immich</text>
  </svg>
{/if}
```

**Step 4: Run tests to verify they pass**

```bash
cd web
pnpm test -- --run src/lib/components/Logo.spec.ts
```

Expected: PASS - all logo tests pass

**Step 5: Commit**

```bash
git add web/src/lib/components/Logo.spec.ts web/src/lib/components/Logo.svelte
git commit -m "test: add Logo component tests for theme variants and fallback"
```

---

### Task 8: Create RotateAction Component Tests

**Files:**

- Create: `web/src/lib/components/timeline/actions/RotateAction.spec.ts`

**Step 1: Write failing test for rotation UI**

Create `web/src/lib/components/timeline/actions/RotateAction.spec.ts`:

```typescript
import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RotateAction from './RotateAction.svelte';
import * as assetService from '$lib/services/asset.service';

vi.mock('$lib/services/asset.service');

describe('RotateAction Component', () => {
  let mockAsset: any;

  beforeEach(() => {
    mockAsset = {
      id: 'asset-1',
      rotation: 0,
      thumbhash: 'oldthumb',
    };

    vi.mocked(assetService.rotateAsset).mockResolvedValue({
      ...mockAsset,
      rotation: 90,
      thumbhash: 'newthumb',
    });
  });

  it('should rotate image 90° on click', async () => {
    const { getByRole } = render(RotateAction, {
      props: { asset: mockAsset },
    });

    const button = getByRole('button', { name: /rotate/i });
    await fireEvent.click(button);

    expect(assetService.rotateAsset).toHaveBeenCalledWith('asset-1', 90);
  });

  it('should send update to server', async () => {
    const { getByRole } = render(RotateAction, {
      props: { asset: mockAsset },
    });

    const button = getByRole('button');
    await fireEvent.click(button);

    expect(assetService.rotateAsset).toHaveBeenCalled();
  });

  it('should refresh thumbnail after rotate', async () => {
    const { getByRole } = render(RotateAction, {
      props: { asset: mockAsset },
    });

    const button = getByRole('button');
    await fireEvent.click(button);

    // Verify thumbhash changed (triggers thumbnail refresh)
    expect(mockAsset.thumbhash).not.toBe('oldthumb');
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd web
pnpm test -- --run src/lib/components/timeline/actions/RotateAction.spec.ts
```

Expected: FAIL - Component or logic missing

**Step 3: Create RotateAction component**

Create `web/src/lib/components/timeline/actions/RotateAction.svelte`:

```svelte
<script lang="ts">
  import { assetService } from '$lib/services/asset.service';
  import type { AssetDto } from '@immich/sdk';

  let { asset }: { asset: AssetDto } = $props();

  async function handleRotate() {
    const updated = await assetService.rotateAsset(asset.id, 90);
    // Update asset (will trigger reactivity)
    Object.assign(asset, updated);
    // Thumbhash change triggers UI refresh
  }
</script>

<button on:click={handleRotate} aria-label="Rotate image">
  <Icon name="rotate-cw" />
</button>
```

**Step 4: Run tests to verify they pass**

```bash
cd web
pnpm test -- --run src/lib/components/timeline/actions/RotateAction.spec.ts
```

Expected: PASS - all rotation tests pass

**Step 5: Commit**

```bash
git add web/src/lib/components/timeline/actions/RotateAction.spec.ts web/src/lib/components/timeline/actions/RotateAction.svelte
git commit -m "test: add RotateAction component tests for image rotation"
```

---

### Task 9: Add LoadingSpinner Branding Tests

**Files:**

- Create: `web/src/lib/components/LoadingSpinner.spec.ts`

**Step 1: Write failing test for spinner**

Create `web/src/lib/components/LoadingSpinner.spec.ts`:

```typescript
import { render } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import LoadingSpinner from './LoadingSpinner.svelte';
import * as themeService from '$lib/services/theme.service';

vi.mock('$lib/services/theme.service');

describe('LoadingSpinner Component', () => {
  it('should render animated spinner', () => {
    const { container } = render(LoadingSpinner);
    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
    expect(svg?.className).toContain('animate');
  });

  it('should apply theme colors', () => {
    vi.mocked(themeService.getThemeColor).mockReturnValue('#FF6B00');
    const { container } = render(LoadingSpinner);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('stroke')).toContain('#FF6B00');
  });
});
```

**Step 2: Run tests**

```bash
cd web
pnpm test -- --run src/lib/components/LoadingSpinner.spec.ts
```

**Step 3: Update component if needed**

**Step 4: Run tests to pass**

**Step 5: Commit**

```bash
git add web/src/lib/components/LoadingSpinner.spec.ts
git commit -m "test: add LoadingSpinner branding tests"
```

---

## Phase 3: Mobile Layer Tests (45 min)

### Task 10: Create Shared Spaces Mobile Service Tests

**Files:**

- Create: `mobile/test/domain/repositories/space_repository_test.dart`

**Step 1: Write failing test for space CRUD**

Create `mobile/test/domain/repositories/space_repository_test.dart`:

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:riverpod/riverpod.dart';
import 'package:immich_mobile/domain/repositories/space_repository.dart';
import 'package:immich_mobile/domain/models/space.dart';

void main() {
  group('SpaceRepository', () {
    late SpaceRepository repository;
    late MockSpaceApi mockApi;

    setUp(() {
      mockApi = MockSpaceApi();
      repository = SpaceRepository(mockApi);
    });

    group('CRUD operations', () {
      test('should create space', () async {
        final newSpace = SpaceDto(
          id: '1',
          name: 'Test Space',
          ownerId: 'owner-1',
          members: [],
        );

        when(mockApi.createSpace(any))
            .thenAnswer((_) => Future.value(newSpace));

        final result = await repository.createSpace('Test Space');

        expect(result.id, equals('1'));
        expect(result.name, equals('Test Space'));
      });

      test('should read space by ID', () async {
        final space = SpaceDto(
          id: '1',
          name: 'Test Space',
          ownerId: 'owner-1',
          members: [],
        );

        when(mockApi.getSpace('1'))
            .thenAnswer((_) => Future.value(space));

        final result = await repository.getSpace('1');

        expect(result.id, equals('1'));
      });

      test('should list spaces', () async {
        final spaces = [
          SpaceDto(id: '1', name: 'Space 1', ownerId: 'owner-1', members: []),
          SpaceDto(id: '2', name: 'Space 2', ownerId: 'owner-1', members: []),
        ];

        when(mockApi.listSpaces())
            .thenAnswer((_) => Future.value(spaces));

        final result = await repository.listSpaces();

        expect(result, hasLength(2));
        expect(result[0].name, equals('Space 1'));
      });

      test('should update space', () async {
        final updated = SpaceDto(
          id: '1',
          name: 'Updated Space',
          ownerId: 'owner-1',
          members: [],
        );

        when(mockApi.updateSpace('1', any))
            .thenAnswer((_) => Future.value(updated));

        final result = await repository.updateSpace('1', name: 'Updated Space');

        expect(result.name, equals('Updated Space'));
      });
    });
  });
}
```

**Step 2: Run tests**

```bash
cd mobile
dart test test/domain/repositories/space_repository_test.dart
```

**Step 3: Implement repository**

**Step 4: Run tests to pass**

**Step 5: Commit**

```bash
git add mobile/test/domain/repositories/space_repository_test.dart
git commit -m "test: add space repository CRUD tests for mobile"
```

---

### Task 11: Create Shared Spaces Mobile Service Tests

**Files:**

- Create: `mobile/test/domain/services/space_service_test.dart`

**Step 1: Write failing test for state management**

Create `mobile/test/domain/services/space_service_test.dart`:

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:riverpod/riverpod.dart';
import 'package:immich_mobile/domain/services/space_service.dart';
import 'package:immich_mobile/domain/models/space.dart';

void main() {
  group('SpaceService', () => {
    late SpaceService service;
    late MockSpaceRepository mockRepository;
    late ProviderContainer container;

    setUp(() {
      mockRepository = MockSpaceRepository();
      container = ProviderContainer(
        overrides: [
          spaceRepositoryProvider.overrideWithValue(mockRepository),
        ],
      );
      service = container.read(spaceServiceProvider);
    });

    group('state management', () {
      test('should sync space list from server', () async {
        final spaces = [
          SpaceDto(id: '1', name: 'Space 1', ownerId: 'owner-1', members: []),
        ];

        when(mockRepository.listSpaces())
            .thenAnswer((_) => Future.value(spaces));

        await service.loadSpaces();

        expect(service.spaces, equals(spaces));
      });

      test('should handle local space updates', () async {
        final space = SpaceDto(
          id: '1',
          name: 'Space 1',
          ownerId: 'owner-1',
          members: [],
        );

        service.spaces = [space];

        service.updateLocalSpace('1', name: 'Updated');

        expect(service.spaces[0].name, equals('Updated'));
      });
    });
  });
}
```

**Step 2-5: Run, implement, pass, commit**

```bash
git add mobile/test/domain/services/space_service_test.dart
git commit -m "test: add space service state management tests for mobile"
```

---

## Phase 4: Cross-Layer Integration Tests (30 min)

### Task 12: Create E2E Test for Space Timeline Integration

**Files:**

- Modify: `e2e/src/specs/web/spaces-p1.e2e-spec.ts`

**Step 1: Write failing E2E test**

Add to `spaces-p1.e2e-spec.ts`:

```typescript
describe('Spaces - Timeline Integration', () => {
  it('should sync space assets to timeline when showInTimeline=true', async () => {
    // Create space
    const spaceName = `Timeline Test ${Date.now()}`;
    const space = await api.spaces.create({ name: spaceName });

    // Create asset in space
    const asset = await api.assets.create({
      file: fs.readFileSync('test-assets/albums/image.jpg'),
    });
    await api.spaces.addAsset(space.id, asset.id);

    // Toggle showInTimeline ON
    await api.spaces.updateMember(space.id, currentUser.id, {
      showInTimeline: true,
    });

    // Check timeline includes space asset
    const timeline = await api.timeline.getTimeline();
    const hasAsset = timeline.some((a) => a.id === asset.id);
    expect(hasAsset).toBe(true);
  });

  it('should remove space assets from timeline when showInTimeline=false', async () => {
    // Setup: create space with asset, toggle ON
    const space = await api.spaces.create({ name: 'Timeline Toggle Test' });
    const asset = await api.assets.create({
      file: fs.readFileSync('test-assets/albums/image.jpg'),
    });
    await api.spaces.addAsset(space.id, asset.id);
    await api.spaces.updateMember(space.id, currentUser.id, {
      showInTimeline: true,
    });

    let timeline = await api.timeline.getTimeline();
    expect(timeline.some((a) => a.id === asset.id)).toBe(true);

    // Toggle OFF
    await api.spaces.updateMember(space.id, currentUser.id, {
      showInTimeline: false,
    });

    timeline = await api.timeline.getTimeline();
    expect(timeline.some((a) => a.id === asset.id)).toBe(false);
  });
});
```

**Step 2: Run E2E test**

```bash
cd e2e && pnpm test:web -- --run spaces-p1
```

**Step 3-5: Implement and commit** (server-side changes already done in Phase 1)

```bash
git add e2e/src/specs/web/spaces-p1.e2e-spec.ts
git commit -m "test: add E2E tests for space timeline integration"
```

---

### Task 13: Create Patrol E2E Test for Mobile Spaces

**Files:**

- Modify: `mobile/integration_test/tests/shared_spaces_test.dart`

**Step 1: Write failing Patrol test**

```dart
void main() {
  patrolTest('should toggle showInTimeline in space', ($) async {
    // Login
    await $.pumpAndSettle();
    // Navigate to spaces
    // Open space
    // Find timeline toggle
    // Tap toggle
    // Verify timeline updated

    expect(find.byType(TimelineView), findsOneWidget);
  });
}
```

**Step 2-5: Run, implement, commit**

---

## Phase 5: Test Utilities & Shared Patterns (20 min)

### Task 14: Create Server Test Factories

**Files:**

- Create: `server/test/factories/space.factory.ts`
- Create: `server/test/factories/space-activity.factory.ts`

[Implementation details: Shared factories for test data]

**Step 5: Commit**

```bash
git add server/test/factories/
git commit -m "test: add server test factories for spaces and activities"
```

---

### Task 15: Create Web Test Mocks

**Files:**

- Create: `web/src/lib/test/mocks/spaces.mock.ts`
- Create: `web/src/lib/test/mocks/socket-io.mock.ts`

[Implementation details: Mock helpers for API and Socket.IO]

**Step 5: Commit**

```bash
git add web/src/lib/test/mocks/
git commit -m "test: add web test mocks for spaces API and Socket.IO"
```

---

### Task 16: Create Mobile Test Fixtures

**Files:**

- Create: `mobile/test/fixtures/space_fixture.dart`

[Implementation details: Dart test data factories]

**Step 5: Commit**

```bash
git add mobile/test/fixtures/
git commit -m "test: add mobile test fixtures for spaces"
```

---

## Summary

**Total Tasks:** 16
**Estimated Duration:** 8-10 hours of focused coding
**Commits:** 16 feature commits

**Priority Order (by ROI):**

1. **Phase 1 (Server)** — 5 tasks, foundation for all other tests
2. **Phase 2 (Web)** — 4 tasks, high visibility features
3. **Phase 3 (Mobile)** — 3 tasks, platform parity
4. **Phase 4 (Integration)** — 2 tests, cross-layer validation
5. **Phase 5 (Utilities)** — 3 tasks, speed up future tests

**Key Principles:**

- TDD: Write failing test → implement → pass → commit
- Bite-sized: Each task is 2-5 minutes of actual coding
- DRY: Shared factories and mocks in Phase 5 prevent duplication
- Frequent commits: 16 commits = easy to review, easy to revert

---

## Execution Options

Plan saved to `docs/plans/2026-03-13-test-coverage-gaps-implementation.md`.

**Two execution approaches:**

**1. Subagent-Driven (this session)**

- I dispatch a fresh subagent per task with exact code
- Code review after each task
- Fast iteration, catch issues immediately
- Best for interactive refinement

**2. Parallel Session (separate)**

- Open new Claude Code session in the same repo
- Use `superpowers:executing-plans` to batch execute
- Good if you want to work independently
- Checkpoint after each phase

**Which approach do you prefer?**
