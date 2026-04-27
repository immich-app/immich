# Auto-Classification

Gallery can automatically tag and optionally archive photos based on their visual content. You define categories with text descriptions, and Gallery uses its CLIP AI model to match photos that look like what you described.

## Use Cases

- **Screenshots** — Auto-tag phone screenshots so they don't clutter your timeline
- **Receipts** — Collect receipt photos under one tag for easy retrieval
- **Documents** — Separate scanned documents from personal photos
- **Nature/Pets** — Auto-tag outdoor scenes or pet photos
- **Sensitive content** — Auto-archive content you don't want visible on the timeline

## Configuration

Classification categories are managed through Gallery's system configuration. There are three ways to configure them:

### Option 1: Admin UI

1. Go to **Administration** > **Settings** > **Classification**
2. Click **Add Category**
3. Fill in:
   - **Name** — A descriptive label (e.g., "Screenshots"). Matching assets get tagged as `Auto/Screenshots`.
   - **Prompts** — One per line. Describe what the photos look like in natural language. Use 2-5 prompts for best results.
   - **Similarity** — How closely a photo must match your prompts (see below).
   - **Action** — "Tag only" or "Tag and archive".
4. Click **Save**

Categories can be enabled/disabled individually without deleting them. The global **Enabled** toggle disables all classification processing.

### Option 2: Config File (YAML)

If you use `IMMICH_CONFIG_FILE`, add categories directly to your YAML configuration:

```yaml
classification:
  enabled: true
  categories:
    - name: Screenshots
      prompts:
        - 'a screenshot of a phone screen'
        - 'a screenshot of a website'
        - 'a screenshot of a chat conversation'
      similarity: 0.28
      action: tag
      faceExclusion: off
      enabled: true
    - name: Receipts
      prompts:
        - 'a photo of a paper receipt'
        - 'a receipt from a store'
        - 'a restaurant bill'
      similarity: 0.28
      action: tag_and_archive
      faceExclusion: off
      enabled: true
```

### Option 3: API

Classification categories are part of the system config endpoint:

```bash
# Read current config
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:2283/api/system-config | jq '.classification'

# Update config (sends full config object)
curl -X PUT -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  http://localhost:2283/api/system-config -d @config.json
```

### Category Fields

| Field           | Type     | Required | Description                                                                                               |
| --------------- | -------- | -------- | --------------------------------------------------------------------------------------------------------- |
| `name`          | string   | Yes      | Category name. Must be unique. Used as the tag name (`Auto/{name}`).                                      |
| `prompts`       | string[] | Yes      | At least one text prompt describing photos to match.                                                      |
| `similarity`    | number   | Yes      | Threshold 0-1. Higher = stricter matching. Default: 0.28.                                                 |
| `action`        | string   | Yes      | `tag` (tag only) or `tag_and_archive` (tag and move to archive).                                          |
| `faceExclusion` | string   | No       | Face exclusion mode: `off`, `any_assigned_face`, `named_people`, or `named_visible_people`. Default: off. |
| `enabled`       | boolean  | Yes      | Whether this category is active. Disabled categories are skipped.                                         |

### Writing Good Prompts

Prompts describe the visual content of photos you want to match. Write them as if describing what you see in the image:

| Category    | Example Prompts                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Screenshots | `a screenshot of a phone screen`, `a screenshot of a website`, `a screenshot of a chat conversation` |
| Receipts    | `a photo of a paper receipt`, `a receipt from a store`, `a restaurant bill`                          |
| Documents   | `a scanned document`, `a photo of a printed page`, `a page of text`                                  |
| Nature      | `a landscape photo of mountains`, `a photo of a forest`, `a sunset over water`                       |
| Pets        | `a photo of a dog`, `a photo of a cat playing`, `a close-up of a pet`                                |

More prompts covering different angles and variations of the same concept improve recall without hurting precision.

### Similarity Threshold

The similarity slider controls how closely a photo must match your prompts:

| Range       | Label  | Behavior                                              |
| ----------- | ------ | ----------------------------------------------------- |
| 0.15 - 0.22 | Loose  | Catches more matches but may include unrelated photos |
| 0.22 - 0.35 | Normal | Recommended. Good balance of coverage and accuracy    |
| 0.35 - 0.45 | Strict | Only very strong matches. May miss borderline photos  |

The default is **0.28** (Normal). Start there and adjust based on results.

### Actions

- **Tag only** (`tag`) — Matching photos get an `Auto/{category name}` tag. They stay on your timeline.
- **Tag and archive** (`tag_and_archive`) — Matching photos get tagged AND moved to the Archive. Useful for screenshots or receipts you want organized but not on your timeline.

### Face exclusion

Each category can optionally skip assets that contain known human faces. This is useful when a category should classify non-personal images, such as receipts, nature photos, or screenshots, without tagging genuine photos of people.

The **Face exclusion** setting has four modes:

| Mode                  | Behavior                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| Off                   | Classifies assets as usual.                                                                        |
| Any assigned face     | Skips the category when the asset has a visible face assigned to a person cluster.                 |
| Named people          | Skips the category when the asset has a visible face assigned to a named person.                   |
| Named, visible people | Skips the category when the asset has a visible face assigned to a named person who is not hidden. |

Unassigned detected faces do not count as known faces, and pets do not count as human faces for this filter.

Face-aware categories require facial recognition. If facial recognition is disabled, Gallery skips those categories instead of treating the asset as safe to classify. Categories set to **Off** continue to run normally.

Face exclusion is future-only. Changing the setting does not remove existing `Auto/...` tags, and later face recognition, person naming, hiding, or merging does not clean up old tags automatically. Run **Scan All Libraries** after changing rules if you want assets to be evaluated again under the new settings; a forced scan can add new matches, but it still does not remove old `Auto/...` tags that are now excluded.

## Scanning Your Library

New uploads are classified automatically. To classify your existing library:

1. Go to **Administration** > **Settings** > **Classification**
2. Click **Scan All Libraries**

Or via API:

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" http://localhost:2283/api/classification/scan
```

This queues all assets across all users for classification. It's additive — existing tags are kept, and new matches get tagged.

## Job Concurrency

Classification runs as a dedicated job queue. By default, it processes one asset at a time (concurrency 1). You can increase this for faster processing:

1. Go to **Administration** > **Jobs**
2. Find the **Classification** queue
3. Adjust the concurrency slider

Higher concurrency is safe — prompt embeddings are cached in memory and deduplicated across concurrent jobs. On machines with fast ML inference (GPU), increasing concurrency to 3-5 can significantly speed up library scans.

You can also configure concurrency via the system config:

```yaml
job:
  classification:
    concurrency: 3
```

## Behavior on Config Changes

When you modify classification categories, Gallery handles changes automatically:

| Change                              | Behavior                                                                                                                                                                                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Add a category**                  | New category takes effect on next classification run. Run "Scan All Libraries" to classify existing assets.                                                                                                                           |
| **Remove a category**               | Existing `Auto/{name}` tags are cleaned up and affected archived assets are unarchived.                                                                                                                                               |
| **Rename a category**               | Old tags are cleaned up (treated as removal + addition). Run scan to re-tag with the new name.                                                                                                                                        |
| **Increase similarity (stricter)**  | Existing auto-tags are removed, archived assets are unarchived. The UI prompts to rescan so only assets matching the new threshold get re-tagged. For config-file admins, this cleanup runs automatically on the next server restart. |
| **Decrease similarity (looser)**    | Takes effect on next classification run. Run scan to find newly-matching assets.                                                                                                                                                      |
| **Change prompts**                  | Prompt embedding cache is cleared. New prompts are encoded on next classification run.                                                                                                                                                |
| **Change action**                   | Takes effect on next classification run. Changing to `tag_and_archive` does not retroactively archive already-tagged assets — run scan to apply.                                                                                      |
| **Disable/enable a category**       | Immediate. Disabled categories are skipped during classification.                                                                                                                                                                     |
| **Disable classification globally** | All classification jobs are skipped. No assets are processed until re-enabled.                                                                                                                                                        |
| **CLIP model change**               | Embedding cache is automatically cleared. All prompts are re-encoded with the new model on next use.                                                                                                                                  |

:::warning Unarchive side effect
Cleaning up an `Auto/{name}` tag (whether by removing the category, renaming it, or tightening its similarity) unarchives **every** asset that currently holds that tag — including photos you manually archived for unrelated reasons. Gallery cannot tell the difference between an auto-archived asset and one you archived yourself.

For config-file admins, this cleanup runs automatically on the next server restart whenever the YAML changes. Watch your server startup logs (`Classification category "X" similarity increased ... clearing auto-tag assignments`) so you know when it happens.
:::

## How It Works

Classification runs automatically after Smart Search processes a photo. The CLIP AI model compares the photo's visual embedding against your category prompts. If the best-matching prompt exceeds the similarity threshold, the photo is classified into that category.

Multiple categories can match the same photo. If any matching category has the "Tag and archive" action, the photo is archived.

## Technical Implementation

### Architecture

Classification categories are stored in Gallery's system configuration (the same `system_metadata` table or YAML config file used for all admin settings). Categories can be managed through the Admin UI, API, or config file. However, if you use a config file (`IMMICH_CONFIG_FILE`), the UI and API are read-only — all changes must be made in the YAML file. This applies to all admin settings, not just classification.

Prompt embeddings (CLIP text vectors) are **not stored in the database**. They are computed lazily by the ML service and cached in memory on the microservices worker. The cache is keyed by `{modelName}::{prompt}` and is cleared automatically when the classification config or CLIP model changes.

### Embedding Cache

```
handleClassify(assetId)
       │
       ├─ getConfig() → classification.categories
       ├─ For each enabled category:
       │   └─ For each prompt:
       │       └─ getOrEncodePrompt(prompt, modelName)
       │           ├─ Check embeddingCache → hit? return cached
       │           ├─ Check pendingEncodes → in-flight? await same promise
       │           └─ Miss? call ML encodeText(), cache result
       │
       └─ Compare cosine similarity, tag/archive as needed
```

The cache ensures each unique prompt is encoded exactly once, regardless of how many assets are processed. Concurrent jobs that need the same prompt share a single in-flight encode via promise deduplication.

### Job Flow

```
Upload / Re-encode
       │
       ▼
  Smart Search (CLIP encode image)
       │
       ▼
  Asset Classify (dedicated queue, configurable concurrency)
       │
       ├─ Load asset embedding from smart_search table
       ├─ Load config: classification.categories (enabled only)
       ├─ For each category: encode prompts (cached), compute max cosine similarity
       ├─ If max similarity ≥ threshold → match
       │   ├─ Create/reuse Auto/{name} tag
       │   ├─ Apply tag to asset
       │   └─ If action = tag_and_archive → archive
       └─ Mark asset as classified (classifiedAt timestamp)
```

### Config Change Handling

Two paths handle config changes, depending on how classification is managed:

**UI / API updates (`onConfigUpdate`)** — fired immediately when an admin saves via the UI or API:

1. If neither classification config nor CLIP model name changed → no action
2. Clear embedding cache (prompts or model may have changed)
3. Diff old vs new categories: for each removed category or category whose similarity increased, call `removeAutoTagAssignments` to clean up `Auto/{name}` tags and unarchive affected assets
4. Persist the new classification config as a snapshot in `system_metadata`

**Config file (`onConfigInit`)** — fired on every server boot, including after a YAML edit + restart:

1. Read the previous classification snapshot from `system_metadata`
2. If a snapshot exists, run the same diff logic against the freshly-loaded config (the file is the source of truth)
3. Persist the current classification config as the new snapshot

The snapshot is the bridge between the two paths. Both paths write it after running cleanup, so the boot-time check never re-runs cleanup that was already handled by the UI path. On the very first boot after upgrading, the snapshot is missing — Gallery just stores a baseline and skips cleanup, so existing tags are preserved.

### Key Details

- **Cosine similarity** computed in-process (dot product / magnitude product), not via database query
- **Batch processing** — `scanLibrary` streams unclassified assets and queues individual jobs in batches of 1,000
- **Idempotent tagging** — Re-classification never duplicates tags (uses upsert)
- **Global kill switch** — `classification.enabled: false` short-circuits both the queue-all job and individual classify jobs without processing any assets
- **Duplicate name validation** — Category names must be unique (enforced by DTO validation)
- **Error resilience** — If the ML service is down, individual classify jobs fail and are retried by BullMQ. Failed encodes are not cached, so the next attempt re-tries the ML call.
