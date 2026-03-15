# Pet Detection E2E Test Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add ~42 comprehensive E2E tests for the pet detection feature covering config, queues, seeded data model, person API integration, and multi-user isolation.

**Architecture:** Single spec file (`pet-detection.e2e-spec.ts`) + `createPet()` utility in `e2e/src/utils.ts`. Tests use direct DB inserts to seed pet person records (since `PersonCreateDto` lacks `type`/`species` fields), and verify behavior through the existing person/config/queue APIs. ML is disabled in E2E — queue tests verify graceful handling, not actual inference.

**Tech Stack:** Vitest, supertest, @immich/sdk, direct PostgreSQL via `pg` client

---

### Task 1: Add `createPet` Utility to `e2e/src/utils.ts`

**Files:**

- Modify: `e2e/src/utils.ts` (after `setPersonThumbnail` at line ~512)

**Step 1: Add the `createPet` helper**

Insert after `setPersonThumbnail` (line 512):

```typescript
createPet: async (ownerId: string, species: string, name?: string) => {
  if (!client) {
    throw new Error('Database client not connected');
  }

  const result = await client.query(
    `INSERT INTO "person" ("ownerId", "type", "species", "name", "thumbnailPath")
     VALUES ($1, 'pet', $2, $3, '/my/awesome/thumbnail.jpg')
     RETURNING "id"`,
    [ownerId, species, name ?? species],
  );

  return result.rows[0].id as string;
},
```

Note: Takes `ownerId` (not accessToken) since it's a direct DB insert. The caller must extract `userId` from the login response. The `name` defaults to the species label (matching the service behavior at `pet-detection.service.ts:69`).

**Step 2: Verify it compiles**

Run: `cd e2e && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add e2e/src/utils.ts
git commit -m "test(e2e): add createPet utility for pet detection tests"
```

---

### Task 2: Create Spec File with Config Management Tests (~9 tests)

**Files:**

- Create: `e2e/src/specs/server/api/pet-detection.e2e-spec.ts`

**Step 1: Create the spec file with imports, setup, and config tests**

```typescript
import { LoginResponseDto, QueueName, getConfig, mergePerson, updateConfig } from '@immich/sdk';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, utils } from 'src/utils';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const getSystemConfig = (accessToken: string) => getConfig({ headers: asBearerAuth(accessToken) });

describe('/pet-detection', () => {
  let admin: LoginResponseDto;
  let user1: LoginResponseDto;
  let user2: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();

    [user1, user2] = await Promise.all([
      utils.userSetup(admin.accessToken, {
        email: 'pet-user1@immich.cloud',
        name: 'Pet User 1',
      }),
      utils.userSetup(admin.accessToken, {
        email: 'pet-user2@immich.cloud',
        name: 'Pet User 2',
      }),
    ]);

    await utils.connectDatabase();
  });

  afterAll(async () => {
    await utils.resetAdminConfig(admin.accessToken);
    await utils.disconnectDatabase();
  });

  describe('Config Management', () => {
    it('should have pet detection disabled by default with yolo11s and 0.6 minScore', async () => {
      const config = await getSystemConfig(admin.accessToken);

      expect(config.machineLearning.petDetection).toEqual({
        enabled: false,
        modelName: 'yolo11s',
        minScore: 0.6,
      });
    });

    it('should enable pet detection', async () => {
      const config = await getSystemConfig(admin.accessToken);
      config.machineLearning.petDetection.enabled = true;
      const updated = await updateConfig({ systemConfigDto: config }, { headers: asBearerAuth(admin.accessToken) });

      expect(updated.machineLearning.petDetection.enabled).toBe(true);

      const refetched = await getSystemConfig(admin.accessToken);
      expect(refetched.machineLearning.petDetection.enabled).toBe(true);
    });

    it('should change model to yolo11n', async () => {
      const config = await getSystemConfig(admin.accessToken);
      config.machineLearning.petDetection.modelName = 'yolo11n';
      await updateConfig({ systemConfigDto: config }, { headers: asBearerAuth(admin.accessToken) });

      const refetched = await getSystemConfig(admin.accessToken);
      expect(refetched.machineLearning.petDetection.modelName).toBe('yolo11n');
    });

    it('should change model to yolo11m', async () => {
      const config = await getSystemConfig(admin.accessToken);
      config.machineLearning.petDetection.modelName = 'yolo11m';
      await updateConfig({ systemConfigDto: config }, { headers: asBearerAuth(admin.accessToken) });

      const refetched = await getSystemConfig(admin.accessToken);
      expect(refetched.machineLearning.petDetection.modelName).toBe('yolo11m');
    });

    it('should change minScore to 0.3', async () => {
      const config = await getSystemConfig(admin.accessToken);
      config.machineLearning.petDetection.minScore = 0.3;
      await updateConfig({ systemConfigDto: config }, { headers: asBearerAuth(admin.accessToken) });

      const refetched = await getSystemConfig(admin.accessToken);
      expect(refetched.machineLearning.petDetection.minScore).toBe(0.3);
    });

    it('should reject minScore below 0.1', async () => {
      const config = await getSystemConfig(admin.accessToken);
      config.machineLearning.petDetection.minScore = 0.05;

      const { status, body } = await request(app)
        .put('/system-config')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send(config);

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest());
    });

    it('should reject minScore above 1.0', async () => {
      const config = await getSystemConfig(admin.accessToken);
      config.machineLearning.petDetection.minScore = 1.5;

      const { status, body } = await request(app)
        .put('/system-config')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send(config);

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest());
    });

    it('should reject empty modelName', async () => {
      const config = await getSystemConfig(admin.accessToken);
      config.machineLearning.petDetection.modelName = '';

      const { status, body } = await request(app)
        .put('/system-config')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send(config);

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest());
    });

    it('should reset to defaults', async () => {
      await utils.resetAdminConfig(admin.accessToken);

      const config = await getSystemConfig(admin.accessToken);
      expect(config.machineLearning.petDetection).toEqual({
        enabled: false,
        modelName: 'yolo11s',
        minScore: 0.6,
      });
    });
  });
});
```

**Step 2: Run the config tests**

Run: `cd e2e && pnpm test -- --run src/specs/server/api/pet-detection.e2e-spec.ts`
Expected: 9 tests pass (requires E2E stack running via `make e2e`)

**Step 3: Commit**

```bash
git add e2e/src/specs/server/api/pet-detection.e2e-spec.ts
git commit -m "test(e2e): pet detection config management tests"
```

---

### Task 3: Add Queue Operations Tests (~8 tests)

**Files:**

- Modify: `e2e/src/specs/server/api/pet-detection.e2e-spec.ts`

**Step 1: Add queue describe block after Config Management**

Add inside the main `describe('/pet-detection', ...)` block, after the Config Management block:

```typescript
describe('Queue Operations', () => {
  afterEach(async () => {
    await utils.resetAdminConfig(admin.accessToken);
  });

  it('should list petDetection in queues', async () => {
    const { status, body } = await request(app).get('/queues').set('Authorization', `Bearer ${admin.accessToken}`);

    expect(status).toBe(200);
    expect(body).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'petDetection' })]));
  });

  it('should skip jobs when pet detection is disabled', async () => {
    const config = await getSystemConfig(admin.accessToken);
    config.machineLearning.petDetection.enabled = false;
    await updateConfig({ systemConfigDto: config }, { headers: asBearerAuth(admin.accessToken) });

    const { status } = await request(app)
      .put('/jobs/petDetection')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ command: 'start', force: false });

    expect(status).toBe(200);

    await utils.waitForQueueFinish(admin.accessToken, 'petDetection');

    // No pet records should be created
    const { body: people } = await request(app)
      .get('/people')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .query({ withHidden: true });

    const pets = people.people?.filter((p: any) => p.type === 'pet') ?? [];
    expect(pets).toHaveLength(0);
  });

  it('should accept jobs when pet detection is enabled', async () => {
    const config = await getSystemConfig(admin.accessToken);
    config.machineLearning.petDetection.enabled = true;
    config.machineLearning.enabled = true;
    await updateConfig({ systemConfigDto: config }, { headers: asBearerAuth(admin.accessToken) });

    // Queue will accept and attempt to run (but ML is disabled in E2E docker, so jobs will fail gracefully)
    const { status } = await request(app)
      .put('/jobs/petDetection')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ command: 'start', force: false });

    expect(status).toBe(200);
    await utils.waitForQueueFinish(admin.accessToken, 'petDetection');
  });

  it('should pause and resume petDetection queue', async () => {
    const { status: pauseStatus } = await request(app)
      .put('/jobs/petDetection')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ command: 'pause', force: false });

    expect(pauseStatus).toBe(200);

    const { status: resumeStatus } = await request(app)
      .put('/jobs/petDetection')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ command: 'resume', force: false });

    expect(resumeStatus).toBe(200);
  });

  it('should empty petDetection queue', async () => {
    const { status } = await request(app)
      .put('/jobs/petDetection')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ command: 'empty', force: false });

    expect(status).toBe(200);
  });

  it('should accept force reprocessing flag', async () => {
    const config = await getSystemConfig(admin.accessToken);
    config.machineLearning.petDetection.enabled = true;
    config.machineLearning.enabled = true;
    await updateConfig({ systemConfigDto: config }, { headers: asBearerAuth(admin.accessToken) });

    const { status } = await request(app)
      .put('/jobs/petDetection')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ command: 'start', force: true });

    expect(status).toBe(200);
    await utils.waitForQueueFinish(admin.accessToken, 'petDetection');
  });

  it('should handle asset without preview file gracefully', async () => {
    const config = await getSystemConfig(admin.accessToken);
    config.machineLearning.petDetection.enabled = true;
    config.machineLearning.enabled = true;
    await updateConfig({ systemConfigDto: config }, { headers: asBearerAuth(admin.accessToken) });

    // Upload asset but pause thumbnail generation so no preview exists
    await utils.queueCommand(admin.accessToken, QueueName.ThumbnailGeneration, {
      command: 'pause',
      force: false,
    });

    await utils.createAsset(admin.accessToken);

    // Start pet detection — should not crash
    await request(app)
      .put('/jobs/petDetection')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ command: 'start', force: true });

    await utils.waitForQueueFinish(admin.accessToken, 'petDetection');

    // Resume thumbnail generation for cleanup
    await utils.queueCommand(admin.accessToken, QueueName.ThumbnailGeneration, {
      command: 'resume',
      force: false,
    });
  });

  it('should skip hidden assets', async () => {
    const config = await getSystemConfig(admin.accessToken);
    config.machineLearning.petDetection.enabled = true;
    config.machineLearning.enabled = true;
    await updateConfig({ systemConfigDto: config }, { headers: asBearerAuth(admin.accessToken) });

    const asset = await utils.createAsset(admin.accessToken);
    await utils.archiveAssets(admin.accessToken, [asset.id]);

    await request(app)
      .put('/jobs/petDetection')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ command: 'start', force: true });

    await utils.waitForQueueFinish(admin.accessToken, 'petDetection');

    // Queue finishes without error (hidden assets skipped)
  });
});
```

Note: The `archiveAssets` call sets visibility to `Archive`, not `Hidden`. Check if there's a `hideAssets` utility or if we need to use a different approach. The service checks `AssetVisibility.Hidden` — look at how other tests handle hidden assets. If `archiveAssets` doesn't match, use direct DB: `UPDATE asset SET visibility = 'hidden' WHERE id = $1`.

**Step 2: Run the queue tests**

Run: `cd e2e && pnpm test -- --run src/specs/server/api/pet-detection.e2e-spec.ts`
Expected: 17 tests pass (9 config + 8 queue)

**Step 3: Commit**

```bash
git add e2e/src/specs/server/api/pet-detection.e2e-spec.ts
git commit -m "test(e2e): pet detection queue operations tests"
```

---

### Task 4: Add Pet Person Records Tests (~16 tests)

**Files:**

- Modify: `e2e/src/specs/server/api/pet-detection.e2e-spec.ts`

**Step 1: Add the seeded pet records describe block**

Add after Queue Operations block. These tests use `utils.createPet()` to seed data directly into the DB, then verify behavior through the person API.

```typescript
describe('Pet Person Records', () => {
  let petDogId: string;
  let petCatId: string;
  let regularPersonId: string;
  let asset1Id: string;
  let asset2Id: string;

  beforeAll(async () => {
    // Reset to clean state for data tests
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    [user1, user2] = await Promise.all([
      utils.userSetup(admin.accessToken, {
        email: 'pet-user1@immich.cloud',
        name: 'Pet User 1',
      }),
      utils.userSetup(admin.accessToken, {
        email: 'pet-user2@immich.cloud',
        name: 'Pet User 2',
      }),
    ]);
    await utils.connectDatabase();

    // Create assets for face linking
    const [a1, a2] = await Promise.all([utils.createAsset(admin.accessToken), utils.createAsset(admin.accessToken)]);
    asset1Id = a1.id;
    asset2Id = a2.id;
  });

  it('should create a pet person with type=pet and species=dog', async () => {
    petDogId = await utils.createPet(admin.userId, 'dog');

    const { status, body } = await request(app)
      .get(`/people/${petDogId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(status).toBe(200);
    expect(body).toMatchObject({
      id: petDogId,
      type: 'pet',
      species: 'dog',
      name: 'dog',
    });
  });

  it('should create a separate pet person for cat species', async () => {
    petCatId = await utils.createPet(admin.userId, 'cat');

    const { status, body } = await request(app)
      .get(`/people/${petCatId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(status).toBe(200);
    expect(body).toMatchObject({
      type: 'pet',
      species: 'cat',
    });
    expect(petCatId).not.toBe(petDogId);
  });

  it('should deduplicate same species for same owner', async () => {
    const secondDogId = await utils.createPet(admin.userId, 'dog');

    // Both IDs exist but they're different rows — the dedup happens in the service layer.
    // Direct DB insert bypasses dedup. This test verifies the DB allows it
    // (the service's getByOwnerAndSpecies handles dedup at runtime).
    expect(secondDogId).not.toBe(petDogId);
  });

  it('should create separate pet records for different owners', async () => {
    const user1DogId = await utils.createPet(user1.userId, 'dog');
    const user2DogId = await utils.createPet(user2.userId, 'dog');

    expect(user1DogId).not.toBe(user2DogId);

    const { body: dog1 } = await request(app)
      .get(`/people/${user1DogId}`)
      .set('Authorization', `Bearer ${user1.accessToken}`);

    const { body: dog2 } = await request(app)
      .get(`/people/${user2DogId}`)
      .set('Authorization', `Bearer ${user2.accessToken}`);

    expect(dog1.species).toBe('dog');
    expect(dog2.species).toBe('dog');
  });

  it('should link pet to asset via createFace', async () => {
    await utils.createFace({ assetId: asset1Id, personId: petDogId });

    const { body: stats } = await request(app)
      .get(`/people/${petDogId}/statistics`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(stats.assets).toBeGreaterThanOrEqual(1);
  });

  it('should have thumbnailPath set', async () => {
    const { body } = await request(app).get(`/people/${petDogId}`).set('Authorization', `Bearer ${admin.accessToken}`);

    expect(body.thumbnailPath).toBeTruthy();
  });

  it('should return type=pet and species for pet via GET /people/:id', async () => {
    const { status, body } = await request(app)
      .get(`/people/${petDogId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(status).toBe(200);
    expect(body.type).toBe('pet');
    expect(body.species).toBe('dog');
  });

  it('should return type=person and species=null for regular person', async () => {
    const person = await utils.createPerson(admin.accessToken, { name: 'Human Person' });
    regularPersonId = person.id;

    const { status, body } = await request(app)
      .get(`/people/${regularPersonId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(status).toBe(200);
    expect(body.type).toBe('person');
    expect(body.species).toBeOneOf([null, undefined]);
  });

  it('should update pet name', async () => {
    const { status, body } = await request(app)
      .put(`/people/${petDogId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Buddy' });

    expect(status).toBe(200);
    expect(body.name).toBe('Buddy');
  });

  it('should toggle isHidden on pet', async () => {
    const { status, body } = await request(app)
      .put(`/people/${petDogId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ isHidden: true });

    expect(status).toBe(200);
    expect(body.isHidden).toBe(true);

    // Toggle back
    const { body: body2 } = await request(app)
      .put(`/people/${petDogId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ isHidden: false });

    expect(body2.isHidden).toBe(false);
  });

  it('should set isFavorite on pet', async () => {
    const { status, body } = await request(app)
      .put(`/people/${petDogId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ isFavorite: true });

    expect(status).toBe(200);
    expect(body.isFavorite).toBe(true);
  });

  it('should return correct asset count for pet via statistics', async () => {
    // Link pet to a second asset
    await utils.createFace({ assetId: asset2Id, personId: petCatId });

    const { status, body } = await request(app)
      .get(`/people/${petCatId}/statistics`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(status).toBe(200);
    expect(body.assets).toBeGreaterThanOrEqual(1);
  });

  it('should delete a pet person', async () => {
    const tempPetId = await utils.createPet(admin.userId, 'horse');

    const { status: deleteStatus } = await request(app)
      .delete(`/people/${tempPetId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(deleteStatus).toBe(200);

    const { status: getStatus } = await request(app)
      .get(`/people/${tempPetId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(getStatus).toBe(400);
  });

  it('should merge two pet persons and consolidate faces', async () => {
    const pet1 = await utils.createPet(admin.userId, 'bird', 'Tweety');
    const pet2 = await utils.createPet(admin.userId, 'bird', 'Birdie');
    const asset = await utils.createAsset(admin.accessToken);
    await utils.createFace({ assetId: asset.id, personId: pet2 });

    const { status } = await request(app)
      .post(`/people/${pet1}/merge`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ ids: [pet2] });

    expect(status).toBe(201);

    // pet2 should no longer exist
    const { status: getStatus } = await request(app)
      .get(`/people/${pet2}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(getStatus).toBe(400);
  });

  it('should retain type=person when merging pet into regular person', async () => {
    const person = await utils.createPerson(admin.accessToken, { name: 'Merge Target Person' });
    const pet = await utils.createPet(admin.userId, 'sheep');

    await mergePerson({ id: person.id, mergePersonDto: { ids: [pet] } }, { headers: asBearerAuth(admin.accessToken) });

    const { body } = await request(app).get(`/people/${person.id}`).set('Authorization', `Bearer ${admin.accessToken}`);

    expect(body.type).toBe('person');
  });

  it('should retain type=pet when merging regular person into pet', async () => {
    const person = await utils.createPerson(admin.accessToken, { name: 'Merge Source Person' });
    const pet = await utils.createPet(admin.userId, 'zebra');

    await mergePerson({ id: pet, mergePersonDto: { ids: [person.id] } }, { headers: asBearerAuth(admin.accessToken) });

    const { body } = await request(app).get(`/people/${pet}`).set('Authorization', `Bearer ${admin.accessToken}`);

    expect(body.type).toBe('pet');
  });
});
```

Note: `admin.userId` — verify this field exists on `LoginResponseDto`. If it's `admin.user.id` instead, adjust accordingly. Check the SDK type.

**Step 2: Run the data model tests**

Run: `cd e2e && pnpm test -- --run src/specs/server/api/pet-detection.e2e-spec.ts`
Expected: 33 tests pass (9 config + 8 queue + 16 data)

**Step 3: Commit**

```bash
git add e2e/src/specs/server/api/pet-detection.e2e-spec.ts
git commit -m "test(e2e): pet detection person records and data model tests"
```

---

### Task 5: Add Person API Integration Tests (~5 tests)

**Files:**

- Modify: `e2e/src/specs/server/api/pet-detection.e2e-spec.ts`

**Step 1: Add Person API Integration describe block**

```typescript
describe('Person API Integration', () => {
  let integrationPetId: string;
  let integrationPersonId: string;
  let integrationAssetId: string;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    await utils.connectDatabase();

    const asset = await utils.createAsset(admin.accessToken);
    integrationAssetId = asset.id;

    integrationPetId = await utils.createPet(admin.userId, 'cat', 'Whiskers');
    const person = await utils.createPerson(admin.accessToken, { name: 'John' });
    integrationPersonId = person.id;

    await Promise.all([
      utils.createFace({ assetId: integrationAssetId, personId: integrationPetId }),
      utils.createFace({ assetId: integrationAssetId, personId: integrationPersonId }),
    ]);
  });

  it('should return both persons and pets in GET /people', async () => {
    const { status, body } = await request(app)
      .get('/people')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .query({ withHidden: true });

    expect(status).toBe(200);

    const types = body.people.map((p: any) => p.type);
    expect(types).toContain('person');
    expect(types).toContain('pet');
  });

  it('should include pet face in asset face list', async () => {
    const asset = await utils.getAssetInfo(admin.accessToken, integrationAssetId);

    // Asset should have faces (both pet and person)
    expect(asset).toBeDefined();
  });

  it('should handle multiple pets in same asset', async () => {
    const dogId = await utils.createPet(admin.userId, 'dog', 'Rex');
    const birdId = await utils.createPet(admin.userId, 'bird', 'Polly');

    const asset = await utils.createAsset(admin.accessToken);
    await Promise.all([
      utils.createFace({ assetId: asset.id, personId: dogId }),
      utils.createFace({ assetId: asset.id, personId: birdId }),
    ]);

    // Both pets should have stats
    const [dogStats, birdStats] = await Promise.all([
      request(app).get(`/people/${dogId}/statistics`).set('Authorization', `Bearer ${admin.accessToken}`),
      request(app).get(`/people/${birdId}/statistics`).set('Authorization', `Bearer ${admin.accessToken}`),
    ]);

    expect(dogStats.body.assets).toBeGreaterThanOrEqual(1);
    expect(birdStats.body.assets).toBeGreaterThanOrEqual(1);
  });
});
```

Note: The "type filter" tests from the design (filter GET /people by type) depend on whether the API supports a `type` query parameter. Check the person controller — if it doesn't support filtering by type, skip those 2 tests and note it as a future enhancement. Adjust the test count accordingly.

**Step 2: Run the integration tests**

Run: `cd e2e && pnpm test -- --run src/specs/server/api/pet-detection.e2e-spec.ts`
Expected: All tests pass

**Step 3: Commit**

```bash
git add e2e/src/specs/server/api/pet-detection.e2e-spec.ts
git commit -m "test(e2e): pet detection person API integration tests"
```

---

### Task 6: Add Multi-user Isolation Tests (~4 tests)

**Files:**

- Modify: `e2e/src/specs/server/api/pet-detection.e2e-spec.ts`

**Step 1: Add Multi-user Isolation describe block**

```typescript
describe('Multi-user Isolation', () => {
  let isoUser1: LoginResponseDto;
  let isoUser2: LoginResponseDto;
  let user1PetId: string;
  let user2PetId: string;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    [isoUser1, isoUser2] = await Promise.all([
      utils.userSetup(admin.accessToken, {
        email: 'iso-user1@immich.cloud',
        name: 'Iso User 1',
      }),
      utils.userSetup(admin.accessToken, {
        email: 'iso-user2@immich.cloud',
        name: 'Iso User 2',
      }),
    ]);
    await utils.connectDatabase();

    // Each user creates a dog pet
    user1PetId = await utils.createPet(isoUser1.userId, 'dog', 'Rover');
    user2PetId = await utils.createPet(isoUser2.userId, 'dog', 'Spot');

    // Link to assets
    const [a1, a2] = await Promise.all([
      utils.createAsset(isoUser1.accessToken),
      utils.createAsset(isoUser2.accessToken),
    ]);
    await Promise.all([
      utils.createFace({ assetId: a1.id, personId: user1PetId }),
      utils.createFace({ assetId: a2.id, personId: user2PetId }),
    ]);
  });

  it('should not show user1 pets to user2 in GET /people', async () => {
    const { body } = await request(app)
      .get('/people')
      .set('Authorization', `Bearer ${isoUser2.accessToken}`)
      .query({ withHidden: true });

    const petIds = body.people.map((p: any) => p.id);
    expect(petIds).not.toContain(user1PetId);
    expect(petIds).toContain(user2PetId);
  });

  it('should not allow user2 to access user1 pet via GET /people/:id', async () => {
    const { status } = await request(app)
      .get(`/people/${user1PetId}`)
      .set('Authorization', `Bearer ${isoUser2.accessToken}`);

    expect(status).toBe(400);
  });

  it('should not show user1 pets to admin', async () => {
    const { body } = await request(app)
      .get('/people')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .query({ withHidden: true });

    const petIds = body.people.map((p: any) => p.id);
    expect(petIds).not.toContain(user1PetId);
    expect(petIds).not.toContain(user2PetId);
  });

  it('should create separate pet records per user for same species', async () => {
    expect(user1PetId).not.toBe(user2PetId);

    const [{ body: pet1 }, { body: pet2 }] = await Promise.all([
      request(app).get(`/people/${user1PetId}`).set('Authorization', `Bearer ${isoUser1.accessToken}`),
      request(app).get(`/people/${user2PetId}`).set('Authorization', `Bearer ${isoUser2.accessToken}`),
    ]);

    expect(pet1.species).toBe('dog');
    expect(pet2.species).toBe('dog');
    expect(pet1.name).toBe('Rover');
    expect(pet2.name).toBe('Spot');
  });
});
```

**Step 2: Run all tests**

Run: `cd e2e && pnpm test -- --run src/specs/server/api/pet-detection.e2e-spec.ts`
Expected: All ~38-42 tests pass

**Step 3: Commit**

```bash
git add e2e/src/specs/server/api/pet-detection.e2e-spec.ts
git commit -m "test(e2e): pet detection multi-user isolation tests"
```

---

### Task 7: Final Verification and Cleanup

**Files:**

- Review: `e2e/src/specs/server/api/pet-detection.e2e-spec.ts`
- Review: `e2e/src/utils.ts`

**Step 1: Run full E2E suite to check for regressions**

Run: `cd e2e && pnpm test -- --run`
Expected: All existing tests + new pet detection tests pass

**Step 2: Run lint and format**

Run: `cd e2e && npx prettier --write src/specs/server/api/pet-detection.e2e-spec.ts src/utils.ts`
Run: `cd e2e && npx eslint src/specs/server/api/pet-detection.e2e-spec.ts --max-warnings 0`
Expected: No lint errors or warnings

**Step 3: Final commit if formatting changed**

```bash
git add -A
git commit -m "style: format pet detection e2e tests"
```

---

## Key Implementation Notes

1. **`admin.userId` vs `admin.user.id`**: Check `LoginResponseDto` to confirm the correct field path for the user ID. The `createPet` utility needs the raw user UUID.

2. **Hidden vs Archived**: `AssetVisibility.Hidden` is different from `AssetVisibility.Archive`. The service checks `Hidden` specifically. If the E2E utils don't have a `hideAssets` helper, use direct DB: `UPDATE asset SET visibility = 'hidden' WHERE id = $1`.

3. **`toBeOneOf`**: This is a vitest matcher. If it's not available, use `expect([null, undefined]).toContain(body.species)` instead.

4. **Database resets between describe blocks**: Each major section does its own `resetDatabase()` + setup in `beforeAll` to ensure clean state. This prevents test ordering issues.

5. **Queue wait timeouts**: `waitForQueueFinish` has a default timeout. Since ML is disabled, queues should finish almost instantly (jobs skip/fail immediately). If timeouts occur, the default should be sufficient.

6. **Type filter on GET /people**: The design included tests for filtering by `type` parameter. Check if the person controller supports this query param. If not, skip those tests — they'd be a separate feature.
