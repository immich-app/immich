# Auto-Classification via CLIP Similarity

## Overview

Users define classification categories with text prompts (e.g., "screenshot of a phone screen",
"meme with text overlay"). When assets are processed by CLIP, their embeddings are compared against
pre-computed prompt embeddings. Matches are auto-tagged and optionally auto-archived.

The first classifier uses CLIP similarity since embeddings already exist for every asset. The system
is designed so additional classification methods (OCR-based, EXIF-based, dedicated models) can be
added as separate features later without requiring changes to this one.

## Data Model

### `classification_category` Table

Per-user category definitions.

| Column       | Type                | Notes                                            |
| ------------ | ------------------- | ------------------------------------------------ |
| `id`         | Generated UUID PK   | `@PrimaryGeneratedColumn()`                      |
| `userId`     | FK → users          | `onDelete: CASCADE`                              |
| `name`       | varchar             | Display name, e.g., "Screenshots"                |
| `similarity` | real                | 0–1, higher = stricter match requirement         |
| `action`     | character varying   | `'tag'` or `'tag_and_archive'`, validated at DTO |
| `enabled`    | Generated boolean   | Default `true`                                   |
| `tagId`      | FK → tag, nullable  | `onDelete: SET NULL`                             |
| `createdAt`  | Generated Timestamp | `@CreateDateColumn()`                            |
| `updatedAt`  | Generated Timestamp | `@UpdateDateColumn()`                            |
| `updateId`   | Generated string    | `@UpdateIdColumn()`                              |

- Unique constraint: `[userId, name]`
- `@UpdatedAtTrigger()` decorator
- `action` is a plain string column (not a PostgreSQL enum) so new actions can be added without a
  migration

### `classification_prompt_embedding` Table

Cached CLIP text embeddings for each prompt.

| Column       | Type                         | Notes                                     |
| ------------ | ---------------------------- | ----------------------------------------- |
| `id`         | Generated UUID PK            | `@PrimaryGeneratedColumn()`               |
| `categoryId` | FK → classification_category | `onDelete: CASCADE`                       |
| `prompt`     | text                         | The text prompt                           |
| `embedding`  | vector(512)                  | `synchronize: false`, CLIP text embedding |
| `createdAt`  | Generated Timestamp          | `@CreateDateColumn()`                     |
| `updatedAt`  | Generated Timestamp          | `@UpdateDateColumn()`                     |

No HNSW index — the number of prompt embeddings per user is small enough (tens, not millions) for
brute-force cosine comparison.

### `asset_job_status` Extension

Add `classifiedAt` timestamp column, following the same pattern as `duplicatesDetectedAt`, `ocrAt`,
and `petsDetectedAt`.

### Tag Convention

Each category auto-creates a hierarchical tag `Auto/{category.name}` on first match. The `Auto`
parent tag is created implicitly by the existing tag hierarchy system (closure table).

## Job Pipeline

### New Queue

`QueueName.Classification` — dedicated BullMQ queue with its own concurrency settings so
classification jobs do not block or get blocked by unrelated work.

### New Jobs

- `AssetClassifyQueueAll` — streams all assets with CLIP embeddings, queues individual
  `AssetClassify` jobs
- `AssetClassify` — per-asset classification against the owner's categories

### Trigger Points

1. **After SmartSearch completes** — chain `AssetClassify` in `job.service.ts` `onDone` handler.
   Unlike `AssetDetectDuplicates` (which only fires for `source === 'upload'`), classification fires
   on **all** SmartSearch completions. This ensures assets re-encoded after a CLIP model change also
   get reclassified.
2. **Manual "Scan Library"** — queues `AssetClassifyQueueAll`, resets `classifiedAt` timestamps so
   all assets are re-evaluated.
3. **Category save/update** — queues `AssetClassifyQueueAll` (without resetting `classifiedAt` — only
   processes assets not yet classified since the last change).

### AssetClassify Job Logic

```
1. Load asset embedding from smart_search
2. Load asset owner's enabled categories + prompt embeddings
   (single query: classification_category JOIN classification_prompt_embedding)
3. If no enabled categories → return immediately (no-op)
4. For each category:
   a. Compute cosine similarity between asset embedding and each prompt embedding
   b. Take maximum similarity (best match across all prompts)
   c. If maxSimilarity >= category.similarity → match
5. For each matched category:
   a. Ensure tag Auto/{name} exists, create if not
   b. Apply tag via tagRepository.upsertAssetIds() (idempotent, onConflict doNothing)
   c. If action is 'tag_and_archive':
      - Check if asset is currently visible (visibility = Timeline)
      - If visible → set visibility = Archive
      - If already archived or if tag already existed (upsert returned no new row) → skip
        UNLESS this is a re-scan (classifiedAt was reset), in which case re-evaluate
        archive action to pick up action changes
6. Update classifiedAt in asset_job_status
```

### Re-scan Behavior

"Scan Library" resets `classifiedAt` and re-evaluates all assets:

- **Additive only for tags** — re-scan adds new tags for newly matching categories but does NOT
  remove tags from assets that no longer match. Users remove stale tags manually or by
  deleting/recreating the category.
- **Re-evaluates archive action** — if a user changed a category from `tag` to `tag_and_archive`,
  re-scan applies the archive to already-tagged assets that are still on the timeline.

### Prompt Embedding Caching

When the user saves categories:

1. For each new or modified prompt, call ML service `encodeText()` to generate the 512-dim embedding
2. Store in `classification_prompt_embedding` alongside the category
3. Unchanged prompts keep their existing embeddings (skip re-encoding)

### CLIP Model Change Handling

Hook into the existing `ConfigUpdate` event (same mechanism as `SmartInfoService.init()`). When the
CLIP model changes:

1. Re-encode all prompt embeddings in `classification_prompt_embedding`
2. Queue `AssetClassifyQueueAll` for full re-evaluation

### Concurrency

In-flight `AssetClassify` jobs use whatever category state they load at execution time. If a user
saves categories while a batch is running, some jobs may use stale data. This is acceptable —
eventual consistency is achieved on the next run.

## Settings UI

New section in **User Settings → Auto-Classification**:

### Category List View

- Table of categories: name, prompt count, similarity level, action badge, enabled toggle
- "Add Category" button
- "Scan Library" button — queues full re-scan, shows toast confirmation

### Category Edit View

- **Name** — text input
- **Prompts** — multi-line text area, one prompt per line. Tip text: "Describe what these images
  look like. Multiple prompts improve accuracy."
- **Similarity** — slider with qualitative labels:
  - ~0.20: "Loose" (catches more, more false positives)
  - ~0.28: "Normal" (recommended default)
  - ~0.35: "Strict" (fewer matches, higher confidence)
- **Action** — dropdown: "Tag only" / "Tag and archive"
- **Delete** button — with confirmation

### Similarity Threshold Defaults

CLIP text-to-image cosine similarity scores are typically 0.25–0.35 for strong matches (much lower
than image-to-image). The slider displays qualitative labels rather than raw percentages to avoid
misleading users into setting unreachable thresholds. Default for new categories: **0.28**.

### No Hardcoded Presets

The UI starts empty. Users add their own categories. Suggested category templates can be added later
as a separate enhancement.

## Edge Cases

| Scenario                              | Behavior                                                                                                                                                                                                             |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tag deleted manually**              | `tagId` set to NULL via FK cascade. Next classification run recreates the `Auto/{name}` tag.                                                                                                                         |
| **Category deleted**                  | Prompt embeddings cascade-deleted. Service explicitly deletes the associated tag (and its tag-asset associations) if `tagId` is set.                                                                                 |
| **CLIP model changed**                | All prompt embeddings re-encoded via ConfigUpdate hook. Full re-classification queued.                                                                                                                               |
| **No categories defined**             | `AssetClassify` loads zero categories, returns immediately.                                                                                                                                                          |
| **Asset already tagged**              | `upsertAssetIds` is idempotent (`onConflict doNothing`).                                                                                                                                                             |
| **Multiple categories match**         | Asset gets multiple `Auto/` tags. Archive wins if any matching category has `tag_and_archive`.                                                                                                                       |
| **User unarchives false positive**    | On normal upload-time classification, asset won't be re-archived (tag exists, upsert returns nothing). On manual re-scan, archive is re-evaluated — user should remove the tag first if they don't want it archived. |
| **`deleteEmptyTags` maintenance job** | May clean up `Auto/` parent tag if all child tags are empty. Harmless — recreated on next classification run.                                                                                                        |
| **Category renamed**                  | Old `Auto/{oldName}` tag persists (orphaned). New `Auto/{newName}` tag created. Service should delete old tag on rename.                                                                                             |

## Extensibility

No abstraction layer or polymorphic dispatch for classifier types. CLIP similarity is the only
classifier. If OCR-based or EXIF-based classification is needed later, they will be separate features
with their own data models, job pipelines, and UI sections. This avoids speculative generality that
would constrain future designs without providing current value.

## Not In Scope

- Review queue / confirmation UI for matches
- User-defined exclusion lists (mark asset as "not this category")
- Automatic tag removal on re-scan (re-classification is additive only)
- Hardcoded category presets
- Cross-user classification (categories are per-user only)
