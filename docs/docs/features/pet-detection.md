# Pet Detection

Immich can automatically detect pets and other animals in your photos using YOLO11 object detection. Detected animals appear in the **People** section alongside human faces, making it easy to browse all photos of a specific pet.

## How It Works

When a photo is uploaded or reprocessed, the machine learning service runs a YOLO11 model to detect animals. Each detected animal is cropped and added to the People section as a recognizable entity, similar to how face detection works for people.

The model detects the following animal categories: bird, cat, dog, horse, sheep, cow, elephant, bear, zebra, and giraffe.

## Model Options

Three model sizes are available, trading accuracy for speed:

| Model     | Parameters | Accuracy (mAP) | Speed    |
| --------- | ---------- | -------------- | -------- |
| `yolo11n` | 2.6M       | 39.5           | Fastest  |
| `yolo11s` | 9.4M       | 47.0           | Balanced |
| `yolo11m` | 20.1M      | 51.5           | Slowest  |

The default model is **yolo11s**, which offers a good balance between accuracy and performance.

## Configuration

### Admin Settings

1. Go to **Administration** > **Machine Learning Settings**.
2. Under **Pet Detection**, choose your preferred model from the dropdown.
3. Adjust the **minimum confidence score** if needed (default: 0.6).

### Re-running Detection

To detect pets in existing photos that were uploaded before pet detection was enabled:

1. Go to **Administration** > **Jobs**.
2. Run the **Pet Detection** job for all assets.

## Tips

- **yolo11n** is fast but can misclassify some animals (e.g., dogs as bears). If you see incorrect detections, try switching to **yolo11s** or **yolo11m**.
- Higher confidence thresholds reduce false positives but may miss some detections. The default of 0.6 works well for most libraries.
- Detected pets can be renamed and merged in the People section, just like human faces.

## Technical Implementation

### Inference Pipeline

```
                         Machine Learning Service
┌──────────┐    ┌──────────────────────────────────────────────┐
│  Server   │    │                                              │
│           │    │  ┌────────────┐  ┌──────────┐  ┌──────────┐ │
│ POST ─────┼───►│  │ Preprocess │─►│ YOLO11   │─►│ Post-    │ │
│ /predict  │    │  │ 640x640    │  │ ONNX     │  │ process  │ │
│           │◄───┼──│ NCHW float │  │ Runtime  │  │ NMS+     │ │
│ [pets]    │    │  └────────────┘  └──────────┘  │ filter   │ │
└──────────┘    │                                  └──────────┘ │
                └──────────────────────────────────────────────┘
```

1. **Preprocessing** — The preview image is resized to 640x640, normalized to float32 [0,1], and transposed to NCHW format.
2. **Inference** — ONNX Runtime runs the YOLO11 model, producing 8,400 anchor predictions with 84 values each (4 bounding box coordinates + 80 COCO class scores).
3. **Postprocessing** — Results are filtered to the 10 animal COCO classes (IDs 14-23), thresholded by the configured `minScore`, and deduplicated with Non-Maximum Suppression (IoU threshold 0.45). Bounding boxes are scaled back to original image coordinates.

Models are downloaded from Hugging Face Hub on first use and cached locally. Inference supports CUDA, OpenVINO, CoreML, and CPU backends via ONNX Runtime.

### Database Changes

Pet detection extends two existing tables rather than creating new ones:

- **`person`** — Added `type` column (VARCHAR, default `'person'`) to distinguish humans from pets, and `species` column (VARCHAR, nullable) for the animal label (e.g., `'dog'`, `'cat'`).
- **`asset_job_status`** — Added `petsDetectedAt` timestamp to track which assets have been processed.

Detected pets are stored as `person` rows with `type = 'pet'`. Each species creates one person entry per user (e.g., one "dog" person, one "cat" person), and individual detections are stored as `asset_face` rows with bounding box coordinates linked to that person. This reuses the existing face/person infrastructure for thumbnails, naming, merging, and browsing.

### Job Flow

Pet detection runs as a dedicated BullMQ queue (`petDetection`) with concurrency of 1:

1. **On upload** — The job service automatically queues a `PetDetection` job alongside face detection and smart search.
2. **Manual re-run** — An admin can trigger `PetDetectionQueueAll` from the Jobs page, which streams all unprocessed assets and queues individual jobs.
3. **Per-asset job** — Each job calls the ML service with the asset's preview file, creates or reuses person entries per species, records `asset_face` bounding boxes, and queues thumbnail generation for new pet persons.
