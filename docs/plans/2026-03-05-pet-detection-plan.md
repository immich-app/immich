# Pet Detection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add opt-in pet detection (YOLOv8) and individual pet recognition (MegaDescriptor) to Immich, with pets appearing alongside people in the UI.

**Architecture:** Two-phase feature — Phase 1 detects animals via YOLOv8 ONNX with bounding boxes stored in the existing `asset_face` table. Phase 2 generates per-pet embeddings via MegaDescriptor, clustering them into `person` entries with `type='pet'`. Reuses the entire person infrastructure (clustering, merge, naming, thumbnails). Feature is disabled by default.

**Tech Stack:** Python (FastAPI, ONNX Runtime, ultralytics), TypeScript (NestJS, Kysely, SvelteKit), PostgreSQL

---

## Task 1: Python ML Schemas — Add PET_DETECTION Task

**Files:**

- Modify: `machine-learning/immich_ml/schemas.py:23-26` (ModelTask enum)
- Modify: `machine-learning/immich_ml/schemas.py` (add output types)

**Step 1: Add ModelTask enum value**

In `machine-learning/immich_ml/schemas.py`, add to the `ModelTask` enum (line 26):

```python
class ModelTask(StrEnum):
    FACIAL_RECOGNITION = "facial-recognition"
    SEARCH = "clip"
    OCR = "ocr"
    PET_DETECTION = "pet-detection"
```

**Step 2: Add output type definitions**

Add after the existing `FacialRecognitionOutput` type (around line 94):

```python
class DetectedPet(TypedDict):
    boundingBox: BoundingBox
    score: float
    label: str


PetDetectionOutput = list[DetectedPet]
```

**Step 3: Run existing tests to verify nothing breaks**

Run: `cd machine-learning && python -m pytest test_main.py -x -q`
Expected: All existing tests pass

**Step 4: Commit**

```bash
git add machine-learning/immich_ml/schemas.py
git commit -m "feat(ml): add PET_DETECTION model task and output types"
```

---

## Task 2: Python PetDetector Model Class

**Files:**

- Create: `machine-learning/immich_ml/models/pet_detection/__init__.py`
- Create: `machine-learning/immich_ml/models/pet_detection/detection.py`

**Step 1: Create module init**

```python
from immich_ml.models.pet_detection.detection import PetDetector

__all__ = ["PetDetector"]
```

**Step 2: Write PetDetector class**

Create `machine-learning/immich_ml/models/pet_detection/detection.py`:

```python
from typing import Any

import numpy as np
from numpy.typing import NDArray

from immich_ml.models.base import InferenceModel
from immich_ml.models.transforms import decode_cv2
from immich_ml.schemas import ModelSession, ModelTask, ModelType, PetDetectionOutput

# COCO animal class IDs and their labels
_ANIMAL_CLASSES: dict[int, str] = {
    14: "bird",
    15: "cat",
    16: "dog",
    17: "horse",
    18: "sheep",
    19: "cow",
    20: "elephant",
    21: "bear",
    22: "zebra",
    23: "giraffe",
}


class PetDetector(InferenceModel):
    depends = []
    identity = (ModelType.DETECTION, ModelTask.PET_DETECTION)

    def __init__(self, model_name: str, min_score: float = 0.6, **model_kwargs: Any) -> None:
        self.min_score = model_kwargs.pop("minScore", min_score)
        super().__init__(model_name, **model_kwargs)

    def _load(self) -> ModelSession:
        session = self._make_session(self.model_path)
        return session

    def _predict(self, inputs: NDArray[np.uint8] | bytes) -> PetDetectionOutput:
        inputs = decode_cv2(inputs)
        h, w = inputs.shape[:2]

        # Preprocess: resize to 640x640, normalize to [0,1], NCHW format
        resized = self._preprocess(inputs)

        # Run ONNX inference
        outputs = self.session.run(None, {self.session.get_inputs()[0].name: resized})

        # Postprocess: filter animal classes, apply NMS, scale boxes
        return self._postprocess(outputs, w, h)

    def _preprocess(self, img: NDArray[np.uint8]) -> NDArray[np.float32]:
        import cv2

        resized = cv2.resize(img, (640, 640))
        blob = resized.astype(np.float32) / 255.0
        blob = blob.transpose(2, 0, 1)  # HWC -> CHW
        return np.expand_dims(blob, axis=0)  # Add batch dim

    def _postprocess(
        self, outputs: list[NDArray[np.float32]], orig_w: int, orig_h: int
    ) -> PetDetectionOutput:
        # YOLOv8 output shape: (1, 84, 8400) — 84 = 4 box coords + 80 class scores
        predictions = outputs[0][0]  # (84, 8400)
        predictions = predictions.T  # (8400, 84)

        boxes = predictions[:, :4]  # cx, cy, w, h
        class_scores = predictions[:, 4:]  # 80 classes

        results: PetDetectionOutput = []

        for i in range(predictions.shape[0]):
            class_id = int(np.argmax(class_scores[i]))
            score = float(class_scores[i, class_id])

            if class_id not in _ANIMAL_CLASSES or score < self.min_score:
                continue

            cx, cy, bw, bh = boxes[i]
            x1 = (cx - bw / 2) * orig_w / 640
            y1 = (cy - bh / 2) * orig_h / 640
            x2 = (cx + bw / 2) * orig_w / 640
            y2 = (cy + bh / 2) * orig_h / 640

            results.append({
                "boundingBox": {
                    "x1": round(float(x1)),
                    "y1": round(float(y1)),
                    "x2": round(float(x2)),
                    "y2": round(float(y2)),
                },
                "score": round(score, 4),
                "label": _ANIMAL_CLASSES[class_id],
            })

        # Simple NMS: sort by score, remove overlapping boxes
        results.sort(key=lambda x: x["score"], reverse=True)
        return self._nms(results, iou_threshold=0.5)

    @staticmethod
    def _nms(detections: PetDetectionOutput, iou_threshold: float) -> PetDetectionOutput:
        if len(detections) <= 1:
            return detections

        kept: PetDetectionOutput = []
        for det in detections:
            should_keep = True
            for kept_det in kept:
                if PetDetector._iou(det["boundingBox"], kept_det["boundingBox"]) > iou_threshold:
                    should_keep = False
                    break
            if should_keep:
                kept.append(det)
        return kept

    @staticmethod
    def _iou(a: dict, b: dict) -> float:
        x1 = max(a["x1"], b["x1"])
        y1 = max(a["y1"], b["y1"])
        x2 = min(a["x2"], b["x2"])
        y2 = min(a["y2"], b["y2"])
        inter = max(0, x2 - x1) * max(0, y2 - y1)
        area_a = (a["x2"] - a["x1"]) * (a["y2"] - a["y1"])
        area_b = (b["x2"] - b["x1"]) * (b["y2"] - b["y1"])
        union = area_a + area_b - inter
        return inter / union if union > 0 else 0.0

    def configure(self, **kwargs: Any) -> None:
        if (min_score := kwargs.get("minScore")) is not None:
            self.min_score = min_score
```

**Step 3: Run linting**

Run: `cd machine-learning && ruff check immich_ml/models/pet_detection/`
Expected: No errors

**Step 4: Commit**

```bash
git add machine-learning/immich_ml/models/pet_detection/
git commit -m "feat(ml): add PetDetector model class with YOLOv8 inference"
```

---

## Task 3: Python Model Registration

**Files:**

- Modify: `machine-learning/immich_ml/models/constants.py:70-75,163-178` (add model set and source)
- Modify: `machine-learning/immich_ml/models/__init__.py:15-48` (add to dispatch)

**Step 1: Add model source and model set to constants.py**

Add a new `ModelSource` enum value (find the enum, likely near top of file):

```python
class ModelSource(StrEnum):
    # ... existing values ...
    YOLO = "yolo"
```

Add model name set:

```python
_YOLO_MODELS = {
    "yolov8n-animals",
    "yolov8s-animals",
}
```

Add to `get_model_source()`:

```python
if cleaned_name in _YOLO_MODELS:
    return ModelSource.YOLO
```

**Step 2: Add dispatch case to `__init__.py`**

In `get_model_class()`, add before the default case:

```python
case ModelSource.YOLO, ModelType.DETECTION, ModelTask.PET_DETECTION:
    from immich_ml.models.pet_detection import PetDetector
    return PetDetector
```

**Step 3: Run existing tests**

Run: `cd machine-learning && python -m pytest test_main.py -x -q`
Expected: All existing tests pass

**Step 4: Commit**

```bash
git add machine-learning/immich_ml/models/constants.py machine-learning/immich_ml/models/__init__.py
git commit -m "feat(ml): register pet detection models in dispatch"
```

---

## Task 4: Python PetDetector Tests

**Files:**

- Modify: `machine-learning/test_main.py` (add test class)

**Step 1: Write PetDetector unit tests**

Add a new test class in `test_main.py` (follow the `TestFaceDetection` pattern at line ~683):

```python
class TestPetDetection:
    def test_detection(self, cv_image: cv2.Mat, mocker: MockerFixture) -> None:
        mocker.patch.object(PetDetector, "load")
        detector = PetDetector("yolov8n-animals", min_score=0.3, cache_dir="test_cache")

        # Mock ONNX session with YOLOv8 output shape (1, 84, 8400)
        mock_session = mock.Mock()
        mock_input = mock.Mock()
        mock_input.name = "images"
        mock_session.get_inputs.return_value = [mock_input]

        # Create fake output with one cat detection (class 15)
        num_detections = 8400
        output = np.zeros((1, 84, num_detections), dtype=np.float32)
        # First detection: cat at center with high score
        output[0, 0, 0] = 320.0  # cx
        output[0, 1, 0] = 320.0  # cy
        output[0, 2, 0] = 200.0  # w
        output[0, 3, 0] = 200.0  # h
        output[0, 4 + 15, 0] = 0.9  # cat class score

        mock_session.run.return_value = [output]
        detector.session = mock_session

        result = detector.predict(cv_image)

        assert isinstance(result, list)
        assert len(result) == 1
        assert result[0]["label"] == "cat"
        assert result[0]["score"] >= 0.3
        assert set(result[0]["boundingBox"]) == {"x1", "y1", "x2", "y2"}
        mock_session.run.assert_called_once()

    def test_filters_non_animal_classes(self, cv_image: cv2.Mat, mocker: MockerFixture) -> None:
        mocker.patch.object(PetDetector, "load")
        detector = PetDetector("yolov8n-animals", min_score=0.3, cache_dir="test_cache")

        mock_session = mock.Mock()
        mock_input = mock.Mock()
        mock_input.name = "images"
        mock_session.get_inputs.return_value = [mock_input]

        # Detection for class 0 (person) — should be filtered out
        num_detections = 8400
        output = np.zeros((1, 84, num_detections), dtype=np.float32)
        output[0, 0, 0] = 320.0
        output[0, 1, 0] = 320.0
        output[0, 2, 0] = 200.0
        output[0, 3, 0] = 200.0
        output[0, 4 + 0, 0] = 0.9  # person class

        mock_session.run.return_value = [output]
        detector.session = mock_session

        result = detector.predict(cv_image)
        assert isinstance(result, list)
        assert len(result) == 0

    def test_filters_low_confidence(self, cv_image: cv2.Mat, mocker: MockerFixture) -> None:
        mocker.patch.object(PetDetector, "load")
        detector = PetDetector("yolov8n-animals", min_score=0.8, cache_dir="test_cache")

        mock_session = mock.Mock()
        mock_input = mock.Mock()
        mock_input.name = "images"
        mock_session.get_inputs.return_value = [mock_input]

        num_detections = 8400
        output = np.zeros((1, 84, num_detections), dtype=np.float32)
        output[0, 0, 0] = 320.0
        output[0, 1, 0] = 320.0
        output[0, 2, 0] = 200.0
        output[0, 3, 0] = 200.0
        output[0, 4 + 16, 0] = 0.5  # dog with score below threshold

        mock_session.run.return_value = [output]
        detector.session = mock_session

        result = detector.predict(cv_image)
        assert isinstance(result, list)
        assert len(result) == 0

    def test_configure_min_score(self, mocker: MockerFixture) -> None:
        mocker.patch.object(PetDetector, "load")
        detector = PetDetector("yolov8n-animals", cache_dir="test_cache")
        assert detector.min_score == 0.6
        detector.configure(minScore=0.8)
        assert detector.min_score == 0.8

    def test_nms_removes_overlapping(self) -> None:
        detections = [
            {"boundingBox": {"x1": 0, "y1": 0, "x2": 100, "y2": 100}, "score": 0.9, "label": "cat"},
            {"boundingBox": {"x1": 5, "y1": 5, "x2": 105, "y2": 105}, "score": 0.8, "label": "cat"},
        ]
        result = PetDetector._nms(detections, iou_threshold=0.5)
        assert len(result) == 1
        assert result[0]["score"] == 0.9
```

**Step 2: Add required import**

At the top of `test_main.py`, add:

```python
from immich_ml.models.pet_detection import PetDetector
```

**Step 3: Run the new tests**

Run: `cd machine-learning && python -m pytest test_main.py::TestPetDetection -v`
Expected: All 5 tests pass

**Step 4: Run full test suite**

Run: `cd machine-learning && python -m pytest test_main.py -x -q`
Expected: All tests pass

**Step 5: Commit**

```bash
git add machine-learning/test_main.py
git commit -m "test(ml): add PetDetector unit tests"
```

---

## Task 5: Server Enums and Config

**Files:**

- Modify: `server/src/enum.ts:551-571,582-664` (QueueName, JobName)
- Modify: `server/src/config.ts:54-84,268-274` (type and defaults)
- Modify: `server/src/utils/misc.ts:95-103` (helper function)

**Step 1: Add QueueName**

In `server/src/enum.ts`, add to `QueueName` enum (after `Ocr = 'ocr'`):

```typescript
PetDetection = 'petDetection',
```

**Step 2: Add JobName entries**

In `server/src/enum.ts`, add to `JobName` enum (after `Ocr = 'Ocr'`):

```typescript
PetDetectionQueueAll = 'PetDetectionQueueAll',
PetDetection = 'PetDetection',
```

**Step 3: Add config type**

In `server/src/config.ts`, add `petDetection` to the `machineLearning` type (after `ocr`):

```typescript
petDetection: {
  enabled: boolean;
  modelName: string;
  minScore: number;
}
```

**Step 4: Add config defaults**

In `server/src/config.ts`, add defaults (after `ocr` defaults):

```typescript
petDetection: {
  enabled: false,
  modelName: 'yolov8n-animals',
  minScore: 0.6,
},
```

**Step 5: Add helper function**

In `server/src/utils/misc.ts`, add after `isOcrEnabled`:

```typescript
export const isPetDetectionEnabled = (machineLearning: SystemConfig['machineLearning']) =>
  isMachineLearningEnabled(machineLearning) && machineLearning.petDetection.enabled;
```

**Step 6: Run type check**

Run: `cd server && npx tsc --noEmit`
Expected: No type errors (or only pre-existing ones)

**Step 7: Commit**

```bash
git add server/src/enum.ts server/src/config.ts server/src/utils/misc.ts
git commit -m "feat(server): add pet detection enums, config, and helper"
```

---

## Task 6: Server DTOs

**Files:**

- Modify: `server/src/dtos/model-config.dto.ts` (add PetDetectionConfig class)
- Modify: `server/src/dtos/system-config.dto.ts:298-332` (add to ML DTO)

**Step 1: Add PetDetectionConfig DTO**

In `server/src/dtos/model-config.dto.ts`, add after `OcrConfig`:

```typescript
export class PetDetectionConfig extends ModelConfig {
  @IsNumber()
  @Min(0.1)
  @Max(1)
  @Type(() => Number)
  @ApiProperty({ type: 'number', format: 'double', description: 'Minimum confidence score for pet detection' })
  minScore!: number;
}
```

**Step 2: Add to SystemConfigMachineLearningDto**

In `server/src/dtos/system-config.dto.ts`, add after the `ocr` field in `SystemConfigMachineLearningDto`:

```typescript
@Type(() => PetDetectionConfig)
@ValidateNested()
@IsObject()
petDetection!: PetDetectionConfig;
```

Add the import for `PetDetectionConfig` at the top of the file.

**Step 3: Run type check**

Run: `cd server && npx tsc --noEmit`
Expected: No new type errors

**Step 4: Commit**

```bash
git add server/src/dtos/model-config.dto.ts server/src/dtos/system-config.dto.ts
git commit -m "feat(server): add PetDetectionConfig DTO"
```

---

## Task 7: Database Schema and Migration

**Files:**

- Modify: `server/src/schema/tables/person.table.ts` (add type, species columns)
- Modify: `server/src/schema/tables/asset-job-status.table.ts` (add petsDetectedAt)
- Create: migration file via `pnpm migrations:generate`

**Step 1: Add columns to person table**

In `server/src/schema/tables/person.table.ts`, add after existing columns:

```typescript
@Column({ type: 'character varying', default: "'person'" })
type!: string;

@Column({ type: 'character varying', nullable: true })
species!: string | null;
```

**Step 2: Add column to asset-job-status table**

In `server/src/schema/tables/asset-job-status.table.ts`, add after `ocrAt`:

```typescript
@Column({ type: 'timestamp with time zone', nullable: true })
petsDetectedAt!: Timestamp | null;
```

**Step 3: Generate migration**

Run: `cd server && pnpm migrations:generate`

This will auto-generate a migration file in `server/src/migrations/`. Verify it contains:

- `ALTER TABLE "person" ADD "type" character varying NOT NULL DEFAULT 'person'`
- `ALTER TABLE "person" ADD "species" character varying`
- `ALTER TABLE "asset_job_status" ADD "petsDetectedAt" TIMESTAMP WITH TIME ZONE`

**Step 4: Run type check**

Run: `cd server && npx tsc --noEmit`
Expected: No new type errors

**Step 5: Commit**

```bash
git add server/src/schema/tables/person.table.ts server/src/schema/tables/asset-job-status.table.ts server/src/migrations/
git commit -m "feat(server): add pet detection database columns and migration"
```

---

## Task 8: Server ML Repository — detectPets Method

**Files:**

- Modify: `server/src/repositories/machine-learning.repository.ts` (add types and method)

**Step 1: Add ModelTask enum value**

In the `ModelTask` enum in the repository file (around line 16-20), add:

```typescript
PET_DETECTION = 'pet-detection',
```

**Step 2: Add response types**

Add after existing type definitions:

```typescript
export type DetectedPet = {
  boundingBox: BoundingBox;
  score: number;
  label: string;
};

export type PetDetectionResponse = { [ModelTask.PET_DETECTION]: DetectedPet[] } & VisualResponse;
```

**Step 3: Add detectPets method**

Add to the `MachineLearningRepository` class (follow the `detectFaces` pattern at line ~195):

```typescript
async detectPets(imagePath: string, { modelName, minScore }: { modelName: string; minScore: number }) {
  const request = {
    [ModelTask.PET_DETECTION]: {
      [ModelType.DETECTION]: { modelName, options: { minScore } },
    },
  };
  const response = await this.predict<PetDetectionResponse>({ imagePath }, request);
  return {
    imageHeight: response.imageHeight,
    imageWidth: response.imageWidth,
    pets: response[ModelTask.PET_DETECTION],
  };
}
```

**Step 4: Run type check**

Run: `cd server && npx tsc --noEmit`
Expected: No new type errors

**Step 5: Commit**

```bash
git add server/src/repositories/machine-learning.repository.ts
git commit -m "feat(server): add detectPets method to ML repository"
```

---

## Task 9: Server Pet Detection Service

**Files:**

- Create: `server/src/services/pet-detection.service.ts`

**Step 1: Write the service**

Create `server/src/services/pet-detection.service.ts` following the OCR service pattern (`server/src/services/ocr.service.ts`):

```typescript
import { Injectable } from '@nestjs/common';
import { OnJob } from 'src/decorators';
import { JobName, JobStatus, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { JobOf } from 'src/types';
import { isPetDetectionEnabled } from 'src/utils/misc';

@Injectable()
export class PetDetectionService extends BaseService {
  @OnJob({ name: JobName.PetDetectionQueueAll, queue: QueueName.PetDetection })
  async handleQueuePetDetection({ force }: JobOf<JobName.PetDetectionQueueAll>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!isPetDetectionEnabled(machineLearning)) {
      return JobStatus.Skipped;
    }

    if (force) {
      await this.assetJobRepository.setPetsDetectedAt(null);
    }

    const assetPagination = this.assetJobRepository.streamForPetDetection(force);
    for await (const assets of assetPagination) {
      await this.jobRepository.queueAll(
        assets.map((asset) => ({ name: JobName.PetDetection, data: { id: asset.id } })),
      );
    }

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.PetDetection, queue: QueueName.PetDetection })
  async handlePetDetection({ id }: JobOf<JobName.PetDetection>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: true });
    if (!isPetDetectionEnabled(machineLearning)) {
      return JobStatus.Skipped;
    }

    const asset = await this.assetRepository.getById(id, { files: true });
    if (!asset?.previewFile) {
      return JobStatus.Failed;
    }

    const { pets, imageHeight, imageWidth } = await this.machineLearningRepository.detectPets(
      asset.previewFile,
      machineLearning.petDetection,
    );

    if (pets.length > 0) {
      const faceRecords = pets.map((pet) => ({
        assetId: id,
        imageHeight,
        imageWidth,
        boundingBoxX1: pet.boundingBox.x1,
        boundingBoxY1: pet.boundingBox.y1,
        boundingBoxX2: pet.boundingBox.x2,
        boundingBoxY2: pet.boundingBox.y2,
        sourceType: 'MACHINE_LEARNING' as const,
      }));

      await this.assetFaceRepository.createAll(faceRecords);
    }

    await this.assetJobRepository.upsertJobStatus({ assetId: id, petsDetectedAt: new Date() });

    return JobStatus.Success;
  }
}
```

Note: The exact repository method names (`streamForPetDetection`, `setPetsDetectedAt`, `createAll`) may need adjustment to match the actual repository API. Check `server/src/repositories/asset-job.repository.ts` and `server/src/repositories/asset-face.repository.ts` for the real method signatures and adapt accordingly. The OCR service (`server/src/services/ocr.service.ts`) is the authoritative reference for the streaming/pagination pattern.

**Step 2: Run type check**

Run: `cd server && npx tsc --noEmit`
Expected: May have errors if repository methods don't match — fix accordingly

**Step 3: Commit**

```bash
git add server/src/services/pet-detection.service.ts
git commit -m "feat(server): add pet detection service"
```

---

## Task 10: Server Job Service Integration

**Files:**

- Modify: `server/src/services/job.service.ts:143-148` (add to fanout)

**Step 1: Add pet detection to post-thumbnail fanout**

In `server/src/services/job.service.ts`, find the post-thumbnail job array (around line 143-148) and add:

```typescript
const jobs: JobItem[] = [
  { name: JobName.SmartSearch, data: item.data },
  { name: JobName.AssetDetectFaces, data: item.data },
  { name: JobName.Ocr, data: item.data },
  { name: JobName.PetDetection, data: item.data },
];
```

The job will be queued but will immediately return `JobStatus.Skipped` if pet detection is disabled (handled in the service).

**Step 2: Register the service**

Find the NestJS module that registers services (likely `server/src/app.module.ts` or a services module). Add `PetDetectionService` to the providers array. Check how `OcrService` is registered and follow the same pattern.

**Step 3: Add JobName to job type mapping**

Search for where `JobName` values are mapped to their data types (likely in `server/src/types.ts` or a similar types file). Add entries for `PetDetectionQueueAll` and `PetDetection` following the OCR pattern.

**Step 4: Run type check**

Run: `cd server && npx tsc --noEmit`
Expected: No new type errors

**Step 5: Run existing tests**

Run: `cd server && pnpm test -- --run`
Expected: Existing tests pass

**Step 6: Commit**

```bash
git add server/src/services/job.service.ts server/src/
git commit -m "feat(server): integrate pet detection into job pipeline"
```

---

## Task 11: Server Unit Tests

**Files:**

- Create: `server/src/services/pet-detection.service.spec.ts`

**Step 1: Write unit tests**

Follow the pattern from existing service tests (check `server/src/services/ocr.service.spec.ts` for the exact test factory pattern with `newTestService()`):

```typescript
import { JobName, JobStatus } from 'src/enum';
import { PetDetectionService } from 'src/services/pet-detection.service';
import { newTestService, ServiceMocks } from 'test/utils';

describe(PetDetectionService.name, () => {
  let sut: PetDetectionService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(PetDetectionService));
  });

  describe('handlePetDetection', () => {
    it('should skip if pet detection is disabled', async () => {
      mocks.configRepository.getSystemConfig.mockResolvedValue({
        machineLearning: { enabled: true, petDetection: { enabled: false } },
      });

      const result = await sut.handlePetDetection({ id: 'asset-1' });
      expect(result).toBe(JobStatus.Skipped);
    });

    it('should skip if machine learning is disabled', async () => {
      mocks.configRepository.getSystemConfig.mockResolvedValue({
        machineLearning: { enabled: false },
      });

      const result = await sut.handlePetDetection({ id: 'asset-1' });
      expect(result).toBe(JobStatus.Skipped);
    });

    it('should fail if asset not found', async () => {
      mocks.configRepository.getSystemConfig.mockResolvedValue({
        machineLearning: {
          enabled: true,
          petDetection: { enabled: true, modelName: 'yolov8n-animals', minScore: 0.6 },
        },
      });
      mocks.assetRepository.getById.mockResolvedValue(undefined);

      const result = await sut.handlePetDetection({ id: 'asset-1' });
      expect(result).toBe(JobStatus.Failed);
    });

    it('should detect pets and store results', async () => {
      mocks.configRepository.getSystemConfig.mockResolvedValue({
        machineLearning: {
          enabled: true,
          petDetection: { enabled: true, modelName: 'yolov8n-animals', minScore: 0.6 },
        },
      });
      mocks.assetRepository.getById.mockResolvedValue({
        id: 'asset-1',
        previewFile: '/path/to/preview.jpg',
      });
      mocks.machineLearningRepository.detectPets.mockResolvedValue({
        imageHeight: 800,
        imageWidth: 600,
        pets: [{ boundingBox: { x1: 10, y1: 20, x2: 200, y2: 300 }, score: 0.9, label: 'cat' }],
      });

      const result = await sut.handlePetDetection({ id: 'asset-1' });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.machineLearningRepository.detectPets).toHaveBeenCalledOnce();
    });
  });

  describe('handleQueuePetDetection', () => {
    it('should skip if pet detection is disabled', async () => {
      mocks.configRepository.getSystemConfig.mockResolvedValue({
        machineLearning: { enabled: true, petDetection: { enabled: false } },
      });

      const result = await sut.handleQueuePetDetection({ force: false });
      expect(result).toBe(JobStatus.Skipped);
    });
  });
});
```

Note: The exact mock setup depends on the `newTestService()` factory pattern. Read `server/test/utils.ts` and an existing service spec like `server/src/services/ocr.service.spec.ts` to see the exact mock property names and patterns. Adapt the test accordingly.

**Step 2: Run the tests**

Run: `cd server && pnpm test -- --run src/services/pet-detection.service.spec.ts`
Expected: All tests pass

**Step 3: Run full test suite**

Run: `cd server && pnpm test -- --run`
Expected: All tests pass

**Step 4: Commit**

```bash
git add server/src/services/pet-detection.service.spec.ts
git commit -m "test(server): add pet detection service unit tests"
```

---

## Task 12: Frontend — Admin ML Settings

**Files:**

- Modify: `web/src/lib/components/admin-settings/MachineLearningSettings.svelte` (add pet detection accordion)

**Step 1: Add pet detection settings accordion**

In `MachineLearningSettings.svelte`, add a new `SettingAccordion` after the OCR section (follow the facial recognition pattern at lines 178-255):

```svelte
<SettingAccordion
  key="pet-detection"
  title={$t('admin.machine_learning_pet_detection')}
  subtitle={$t('admin.machine_learning_pet_detection_description')}
>
  <div class="ms-4 mt-4 flex flex-col gap-4">
    <SettingSwitch
      title={$t('admin.machine_learning_pet_detection_setting')}
      subtitle={$t('admin.machine_learning_pet_detection_setting_description')}
      bind:checked={configToEdit.machineLearning.petDetection.enabled}
      disabled={disabled || !configToEdit.machineLearning.enabled}
    />

    <hr />

    <SettingSelect
      label={$t('admin.machine_learning_pet_detection_model')}
      desc={$t('admin.machine_learning_pet_detection_model_description')}
      name="pet-detection-model"
      bind:value={configToEdit.machineLearning.petDetection.modelName}
      options={[
        { value: 'yolov8n-animals', text: 'yolov8n-animals (fast)' },
        { value: 'yolov8s-animals', text: 'yolov8s-animals (accurate)' },
      ]}
      disabled={disabled ||
        !configToEdit.machineLearning.enabled ||
        !configToEdit.machineLearning.petDetection.enabled}
      isEdited={configToEdit.machineLearning.petDetection.modelName !==
        config.machineLearning.petDetection.modelName}
    />

    <SettingInputField
      inputType={SettingInputFieldType.NUMBER}
      label={$t('admin.machine_learning_min_detection_score')}
      description={$t('admin.machine_learning_min_detection_score_description')}
      bind:value={configToEdit.machineLearning.petDetection.minScore}
      step="0.01"
      min={0.1}
      max={1}
      disabled={disabled ||
        !configToEdit.machineLearning.enabled ||
        !configToEdit.machineLearning.petDetection.enabled}
      isEdited={configToEdit.machineLearning.petDetection.minScore !==
        config.machineLearning.petDetection.minScore}
    />
  </div>
</SettingAccordion>
```

**Step 2: Add translation keys**

Find the i18n translation files (likely `web/src/lib/i18n/` or `i18n/`). Add the keys:

```json
"admin.machine_learning_pet_detection": "Pet Detection",
"admin.machine_learning_pet_detection_description": "Detect cats, dogs, and other animals in photos",
"admin.machine_learning_pet_detection_setting": "Pet Detection",
"admin.machine_learning_pet_detection_setting_description": "Enable automatic pet detection using YOLOv8",
"admin.machine_learning_pet_detection_model": "Pet Detection Model",
"admin.machine_learning_pet_detection_model_description": "Model used for detecting pets. Nano is faster, Small is more accurate."
```

**Step 3: Add PetDetection to job queue names**

In `web/src/lib/components/admin-settings/JobSettings.svelte` (around line 15-27), add `QueueName.PetDetection` to the `queueNames` array.

**Step 4: Run web type check**

Run: `make check-web`
Expected: No new type errors

**Step 5: Commit**

```bash
git add web/src/lib/components/admin-settings/
git commit -m "feat(web): add pet detection admin settings"
```

---

## Task 13: Frontend — Pet Badge on People Cards

**Files:**

- Modify: `web/src/lib/components/faces-page/people-card.svelte` (add pet badge)

**Step 1: Add pet badge**

In `people-card.svelte`, add a conditional badge when `person.type === 'pet'`. After the thumbnail element (around lines 52-58), add:

```svelte
{#if person.type === 'pet'}
  <div class="absolute bottom-1 right-1 rounded-full bg-immich-primary p-1 text-white" title={person.species}>
    <Icon path={mdiPaw} size="14" />
  </div>
{/if}
```

Add the import for the paw icon at the top:

```typescript
import { mdiPaw } from '@mdi/js';
```

Note: The `person.type` and `person.species` fields will only be available after the OpenAPI SDK is regenerated (Task 14). The `PersonResponseDto` type will need to include these new fields.

**Step 2: Run web tests**

Run: `cd web && pnpm test -- --run`
Expected: Existing tests pass

**Step 3: Commit**

```bash
git add web/src/lib/components/faces-page/people-card.svelte
git commit -m "feat(web): add pet badge on people cards"
```

---

## Task 14: OpenAPI Regeneration and Final Integration

**Files:**

- Regenerated: `open-api/` (TypeScript SDK and Dart client)

**Step 1: Build server**

Run: `cd server && pnpm build`
Expected: Build succeeds

**Step 2: Regenerate OpenAPI spec**

Run: `cd server && pnpm sync:open-api`
Expected: Spec regenerated

**Step 3: Regenerate SDK clients**

Run: `make open-api`
Expected: TypeScript SDK and Dart client regenerated with new `petDetection` config fields and `type`/`species` fields on `PersonResponseDto`

**Step 4: Run all linting and type checks**

Run: `make check-all && make lint-all`
Expected: All pass

**Step 5: Run server tests**

Run: `cd server && pnpm test -- --run`
Expected: All pass

**Step 6: Run web tests**

Run: `cd web && pnpm test -- --run`
Expected: All pass

**Step 7: Commit**

```bash
git add open-api/ server/src/
git commit -m "chore: regenerate OpenAPI clients with pet detection types"
```

---

## Task Summary

| Task | Component | Description                                  |
| ---- | --------- | -------------------------------------------- |
| 1    | ML Python | Add ModelTask.PET_DETECTION and output types |
| 2    | ML Python | PetDetector class with YOLOv8 inference      |
| 3    | ML Python | Register models in constants + dispatch      |
| 4    | ML Python | PetDetector unit tests                       |
| 5    | Server    | Enums, config type/defaults, helper function |
| 6    | Server    | PetDetectionConfig DTO                       |
| 7    | Server    | Database schema + migration                  |
| 8    | Server    | ML repository detectPets method              |
| 9    | Server    | PetDetectionService                          |
| 10   | Server    | Job pipeline integration                     |
| 11   | Server    | Service unit tests                           |
| 12   | Web       | Admin ML settings accordion                  |
| 13   | Web       | Pet badge on people cards                    |
| 14   | All       | OpenAPI regen + final integration check      |

## Phase 2 Follow-up (not in this plan)

After Phase 1 is validated:

- Add `PetRecognizer` model class using MegaDescriptor
- Add embedding storage + clustering in the service
- Add `allowedSpecies` config and gating logic
- Add person entry creation with `type='pet'` and `species` fields
