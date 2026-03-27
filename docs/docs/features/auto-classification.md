# Auto-Classification

Gallery can automatically tag and optionally archive photos based on their visual content. You define categories with text descriptions, and Gallery uses its CLIP AI model to match photos that look like what you described.

## Use Cases

- **Screenshots** — Auto-tag phone screenshots so they don't clutter your timeline
- **Receipts** — Collect receipt photos under one tag for easy retrieval
- **Documents** — Separate scanned documents from personal photos
- **Nature/Pets** — Auto-tag outdoor scenes or pet photos
- **Sensitive content** — Auto-archive content you don't want visible on the timeline

## Creating a Category

1. Go to **User Settings > Classification**
2. Click **Add Category**
3. Fill in:
   - **Name** — A descriptive label (e.g., "Screenshots"). Matching assets get tagged as `Auto/Screenshots`.
   - **Prompts** — One per line. Describe what the photos look like in natural language. Use 2-5 prompts for best results.
   - **Similarity** — How closely a photo must match your prompts to be classified (see below).
   - **Action** — "Tag only" or "Tag and archive".
4. Click **Save**

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

- **Tag only** — Matching photos get an `Auto/{category name}` tag. They stay on your timeline.
- **Tag and archive** — Matching photos get tagged AND moved to the Archive. Useful for screenshots or receipts you want organized but not on your timeline.

## Managing Categories

- **Enable/disable** — Toggle a category on or off without deleting it. Disabled categories are skipped during classification.
- **Edit** — Change the name, prompts, similarity, or action at any time. Prompt changes trigger re-encoding.
- **Delete** — Removes the category and its associated `Auto/` tag.

## Scanning Your Library

New uploads are classified automatically. To classify existing photos:

1. Go to **User Settings > Classification**
2. Click **Scan Library**

This queues all your assets for classification. It's additive — existing tags are kept, and new matches get tagged. Assets that no longer match are NOT untagged (remove stale tags manually if needed).

## How It Works

Classification runs automatically after Smart Search processes a photo. The CLIP AI model compares the photo's visual embedding against your category prompts. If the best-matching prompt exceeds the similarity threshold, the photo is classified into that category.

Multiple categories can match the same photo. If any matching category has the "Tag and archive" action, the photo is archived.

## Technical Implementation

### Architecture

Classification is a per-user feature built on top of Gallery's existing CLIP Smart Search infrastructure. Each user defines categories with text prompts. Prompts are encoded into CLIP embedding vectors and stored in the database. When an asset is processed, its image embedding is compared against all of the user's prompt embeddings using cosine similarity.

### Data Model

**`classification_category`** — One row per category per user:

- `userId`, `name` (unique per user), `similarity` threshold (0-1), `action` (tag / tag_and_archive), `enabled`, `tagId` (FK to auto-generated tag)

**`classification_prompt_embedding`** — One row per prompt:

- `categoryId` (FK, cascade delete), `prompt` (text), `embedding` (512-dim vector)

### Job Flow

```
Upload / Re-encode
       │
       ▼
  Smart Search (CLIP encode image)
       │
       ▼
  Asset Classify (dedicated queue)
       │
       ├─ Load asset embedding from smart_search table
       ├─ Load all enabled categories + prompt embeddings for asset owner
       ├─ For each category: max cosine similarity across prompts
       ├─ If max similarity ≥ threshold → match
       │   ├─ Create/reuse Auto/{name} tag
       │   ├─ Apply tag to asset
       │   └─ If action = tag_and_archive → archive
       └─ Mark asset as classified
```

Classification chains after Smart Search for all completions (uploads and re-encodes), so assets reprocessed after a CLIP model change are reclassified automatically.

### Prompt Embedding Management

- Prompts are encoded via the ML service's CLIP text encoder on category create/update
- When the CLIP model changes (detected via `ConfigUpdate` event), all prompt embeddings are re-encoded automatically
- No HNSW index on prompt embeddings — the number of prompts per user is too small to benefit from indexing

### Key Details

- **Cosine similarity** computed in-process (dot product / magnitude product), not via database query
- **Batch processing** — `scanLibrary` streams unclassified assets and queues individual jobs in batches of 1,000
- **Idempotent tagging** — Re-classification never duplicates tags
- **Tag lifecycle** — Deleting a category cascade-deletes its prompt embeddings and explicitly deletes the auto-generated tag. If a tag is manually deleted, it's recreated on next classification.
