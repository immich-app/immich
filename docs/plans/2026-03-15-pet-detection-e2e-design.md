# Pet Detection E2E Test Design

**Date:** 2026-03-15
**Scope:** Comprehensive E2E test coverage for pet detection feature
**Approach:** Single spec file + shared `createPet()` utility

## Overview

Add ~42 E2E tests covering config management, queue operations, seeded pet data model, person API integration, and multi-user isolation. ML service is disabled in E2E — tests verify API/DB behavior, seed pet data via direct DB inserts for read-path coverage.

## New Utility: `createPet()`

Added to `e2e/src/utils.ts` alongside existing `createPerson()` and `createFace()`:

```typescript
createPet: async (accessToken: string, species: string, assetId?: string) => {
  // 1. Direct DB insert: person with type='pet', species=<species>, ownerId from token
  // 2. If assetId provided, also insert asset_face linking pet to asset
  // 3. Set placeholder thumbnail (like createPerson does)
  // Returns PersonResponseDto-shaped object
};
```

Rationale: `PersonCreateDto` doesn't expose `type`/`species` fields, so pets can only be created via the detection pipeline or direct DB. Since ML is disabled in E2E, direct DB is the only option for seeding.

## Test File: `e2e/src/specs/pet-detection.e2e-spec.ts`

### Section 1: Config Management (~9 tests)

| #   | Test                        | Assert                                                         |
| --- | --------------------------- | -------------------------------------------------------------- |
| 1   | GET default config          | petDetection: enabled=false, modelName='yolo11s', minScore=0.6 |
| 2   | PUT enable pet detection    | persists on re-fetch                                           |
| 3   | PUT change model to yolo11n | persists                                                       |
| 4   | PUT change model to yolo11m | persists                                                       |
| 5   | PUT change minScore to 0.3  | persists                                                       |
| 6   | PUT invalid minScore (0.05) | 400 Bad Request                                                |
| 7   | PUT invalid minScore (1.5)  | 400 Bad Request                                                |
| 8   | PUT empty modelName         | 400 Bad Request                                                |
| 9   | PUT reset to defaults       | returns to yolo11s/0.6/disabled                                |

### Section 2: Queue Operations (~8 tests)

| #   | Test                              | Assert                                       |
| --- | --------------------------------- | -------------------------------------------- |
| 1   | GET /queues lists petDetection    | queue present in response                    |
| 2   | Start queue when feature disabled | jobs skip gracefully, no pet records created |
| 3   | Start queue when enabled          | queue accepts jobs                           |
| 4   | Pause/resume queue                | state toggles correctly                      |
| 5   | Empty queue                       | DELETE clears pending jobs                   |
| 6   | Start with force=true             | reprocesses already-processed assets         |
| 7   | Asset without preview file        | job handles gracefully (no crash)            |
| 8   | Hidden asset                      | skipped during queue processing              |

### Section 3: Pet Person Records — Seeded via DB (~16 tests)

| #   | Test                              | Assert                                |
| --- | --------------------------------- | ------------------------------------- |
| 1   | createPet with species='dog'      | person with type='pet', species='dog' |
| 2   | createPet with species='cat'      | separate person record                |
| 3   | Same species + same owner (dedup) | only one person record                |
| 4   | Same species + different owners   | separate person records               |
| 5   | createPet + createFace            | pet linked to asset with bounding box |
| 6   | Pet person thumbnail              | thumbnailPath set after face link     |
| 7   | GET /people/:id for pet           | returns type='pet', species='dog'     |
| 8   | GET /people/:id for person        | returns type='person', species=null   |
| 9   | PUT /people/:id update pet name   | name updated to "Buddy"               |
| 10  | PUT /people/:id toggle isHidden   | hidden state toggles                  |
| 11  | PUT /people/:id set isFavorite    | favorite state set                    |
| 12  | DELETE /people/:id                | pet person record removed             |
| 13  | GET /people/:id/statistics        | correct asset count for pet           |
| 14  | Merge two pet persons             | faces consolidated under target       |
| 15  | Merge pet into regular person     | target retains type='person'          |
| 16  | Merge regular person into pet     | target retains type='pet'             |

### Section 4: Person API Integration (~5 tests)

| #   | Test                                        | Assert                            |
| --- | ------------------------------------------- | --------------------------------- |
| 1   | GET /people returns both persons and pets   | mixed list                        |
| 2   | GET /people with type filter → pets only    | if filter exists                  |
| 3   | GET /people with type filter → persons only | if filter exists                  |
| 4   | Pet face in asset's face list               | GET /assets/:id includes pet face |
| 5   | Multiple pets in same asset                 | all faces returned                |

### Section 5: Multi-user Isolation (~4 tests)

| #   | Test                                       | Assert                        |
| --- | ------------------------------------------ | ----------------------------- |
| 1   | User1's pets not visible to User2          | GET /people scoped to owner   |
| 2   | User1's pet → User2 cannot GET /people/:id | 400 or empty                  |
| 3   | Admin cannot see User1's pets              | ownership boundary            |
| 4   | Same species, different users              | separate pet records per user |

## Setup Pattern

```typescript
beforeAll:
  - resetDatabase()
  - adminSetup()
  - userSetup() x2
  - connectDatabase() (for direct DB access)
  - createAsset() for each user (for face linking)

afterAll:
  - resetAdminConfig()
  - disconnectDatabase()
```

## Dependencies

- Existing: `createPerson`, `createFace`, `setPersonThumbnail`, `getSystemConfig`, `waitForQueueFinish`, `queueCommand`
- New: `createPet` utility in `e2e/src/utils.ts`
- DB access: direct PostgreSQL queries for seeding pet records (type/species not in create DTO)
