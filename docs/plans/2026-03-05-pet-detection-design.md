# Pet Detection & Recognition Design

## Overview

Add pet detection and individual pet recognition to Immich, allowing users to find and organize photos of their pets the same way they do with people.

**Phased approach:**

- **Phase 1** — Pet Detection (YOLOv8): detect animals in photos with bounding boxes and species labels
- **Phase 2** — Pet Recognition (MegaDescriptor): generate embeddings for detected pets, cluster them into named individuals shown alongside people

Feature is **opt-in**: disabled by default (`petDetection.enabled = false`). No models downloaded, no jobs queued, no UI changes until explicitly enabled. Matches the pattern used by OCR.

Backfill: new uploads processed automatically when enabled. Existing assets require manual "Re-process all" from admin settings.

## Community Context

636 upvotes on [Discussion #7151](https://github.com/immich-app/immich/discussions/7151) — the 3rd most requested feature. Users want:

- Find all photos of a specific pet by name (like Google Photos / Apple Photos)
- Pets shown alongside people in the UI
- Support beyond cats/dogs (horses, birds, etc.)
- Ability to correct misidentifications manually

## ML Service Changes (Python)

### New Model Task

Add to `machine-learning/immich_ml/schemas.py`:

```python
class ModelTask(StrEnum):
    PET_DETECTION = "pet-detection"
```

### New Model Classes

**PetDetector** (`machine-learning/immich_ml/models/pet_detection/detection.py`):

- YOLOv8n (nano, ~6MB ONNX) or YOLOv8s (small, ~22MB ONNX)
- Input: image
- Output: list of `{ boundingBox, species, confidence }`
- Filters to the 10 COCO animal classes: cat, dog, bird, horse, sheep, cow, elephant, bear, zebra, giraffe
- Model hosted on HuggingFace under `immich-app/` org

**PetRecognizer** (`machine-learning/immich_ml/models/pet_detection/recognition.py`) (Phase 2):

- MegaDescriptor (`BVRA/MegaDescriptor-L-384`) exported to ONNX
- Input: cropped pet region from detector
- Output: embedding vector
- Depends on PetDetector output (same dependency chain as FaceDetector -> FaceRecognizer)

### Registration

Add both models to:

- `models/__init__.py:get_model_class()` — model class routing
- `models/constants.py` — model name validation

No changes needed to the `/predict` endpoint — existing dependency resolution handles the detector->recognizer chain.

## Server Changes (TypeScript)

### Configuration

Add to `server/src/config.ts` under `machineLearning`:

```typescript
petDetection: {
  enabled: boolean             // default: false
  modelName: string            // default: "yolov8n-animals"
  minScore: number             // default: 0.6
  recognitionModelName: string // default: "MegaDescriptor-L-384" (Phase 2)
  allowedSpecies: string[]     // default: ["cat", "dog"]
}
```

`allowedSpecies` controls which detected species get Phase 2 recognition (embedding + person entry creation). All 10 COCO species are always detected and stored, but only allowed species create person entries to avoid polluting the People section with zoo animals.

### Jobs & Queue

Add to `server/src/enum.ts`:

- `JobName.PetDetection` — process a single asset
- `JobName.PetDetectionQueueAll` — queue all assets for backfill
- `QueueName.PetDetection`

### Job Service

In `server/src/services/job.service.ts`, hook `PetDetection` into the post-thumbnail fan-out (alongside SmartSearch, FaceDetection, OCR). Only queues if `petDetection.enabled` is true.

### Pet Detection Service

New file: `server/src/services/pet-detection.service.ts`

**`handlePetDetection(assetId)`:**

1. Call ML service with detection model (+ recognition model for allowed species)
2. For each detected animal: store bounding box in `asset_face` table with `sourceType = 'MACHINE_LEARNING'`
3. For allowed species (Phase 2): store embedding in `face_search`, cluster to match/create person entries with `type = 'pet'`
4. Set `asset_job_status.petsDetectedAt = now()`

**`handlePetDetectionQueueAll()`:**
Query all assets where `petsDetectedAt IS NULL`, queue a `PetDetection` job for each.

### ML Repository

Add to `server/src/repositories/machine-learning.repository.ts`:

- `detectPets(imagePath, config)` — constructs FormData request to ML service

## Database Schema Changes

Reuse existing tables — no new tables needed.

### `person` table — add columns:

- `type: varchar` — `'person'` (default) or `'pet'`
- `species: varchar | null` — `'cat'`, `'dog'`, `'bird'`, `'horse'`, etc. Null for persons.

### `asset_job_status` table — add column:

- `petsDetectedAt: timestamp | null`

### `asset_face` table — no changes

Pet detections stored as face records with bounding boxes, linked to person entries with `type = 'pet'`.

### `face_search` table — no changes

Pet embeddings stored exactly like face embeddings.

### Migration

One migration adding 3 nullable columns with defaults. Existing data unaffected. Adding nullable columns in PostgreSQL is instant (no table rewrite).

## Frontend Changes (SvelteKit)

### People Page

- Add species icon/badge (paw icon) on person cards where `type = 'pet'`
- Pets interleaved with people (no separate section)

### Person Detail Page

- Show species label (e.g. "Cat", "Dog") below pet name
- All existing functionality (photo grid, merge, rename) works unchanged

### Admin Settings

New "Pet Detection" section under Machine Learning:

- Enable/disable toggle
- Model name field
- Min confidence score slider
- Allowed species multi-select (default: cat, dog)
- "Re-process all" button for backfill

### No Changes Needed

Search, timeline, albums, sharing — pets are person entities and flow through everything automatically.

## End-to-End Data Flow

```
Asset Upload
    |
Thumbnail Generation
    | (fan-out, if petDetection.enabled)
Pet Detection Job
    |
Server sends image to ML service POST /predict
    |
ML service runs YOLOv8 -> [{boundingBox, species, confidence}, ...]
    |
Server filters detections by minScore
    |
For each detection:
    +-- Store bounding box in asset_face table
    +-- Is species in allowedSpecies list?
        +-- YES -> ML service runs MegaDescriptor on cropped region -> embedding
        |          Store embedding in face_search table
        |          Cluster against existing pet embeddings
        |          Match to existing person (type=pet) or create new one
        +-- NO  -> Done (detection stored, no recognition)
    |
Set asset_job_status.petsDetectedAt = now()
```

**Backfill:**

```
Admin clicks "Re-process all"
    |
PetDetectionQueueAll job
    |
Query assets where petsDetectedAt IS NULL
    |
Queue PetDetection job for each
```

## Model Options Summary

| Model                | Purpose                          | Size        | Source                           |
| -------------------- | -------------------------------- | ----------- | -------------------------------- |
| YOLOv8n              | Pet detection (bounding boxes)   | ~6MB ONNX   | Ultralytics, export + host on HF |
| YOLOv8s              | Pet detection (higher accuracy)  | ~22MB ONNX  | Ultralytics, export + host on HF |
| MegaDescriptor-L-384 | Pet re-identification embeddings | ~330MB ONNX | BVRA on HuggingFace              |

## References

- [Discussion #7151](https://github.com/immich-app/immich/discussions/7151) — original feature request (636 upvotes)
- [BVRA/MegaDescriptor](https://huggingface.co/BVRA) — species-agnostic animal re-identification
- [rtp4jc/immich-animals](https://github.com/rtp4jc/immich-animals) — community effort on custom pet face recognition
- [Immich livestream on pet recognition](https://youtu.be/6KtNNjp78xI?t=1044) — team discussion at 17:24
- [YOLOv8 COCO classes](https://docs.ultralytics.com/datasets/detect/coco/) — 10 animal classes available
