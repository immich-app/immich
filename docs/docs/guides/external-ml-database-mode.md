# External ML Database Mode

:::warning
This guide documents the custom behavior in this fork. It is not part of upstream Immich by default.
:::

This fork adds a split machine learning mode:

- CLIP can use dimension-based model names and send only `assetId` to the external machine learning HTTP service.
- OCR can use `modelName: other` and become passive. Immich stops running OCR jobs and only displays/searches OCR rows that already exist in PostgreSQL.
- Facial recognition can use `modelName: other` and become passive. Immich stops running face detection, face clustering, and recognition jobs and only displays people/faces that already exist in PostgreSQL.

Use this mode when you want your own service to do the machine learning work and write results directly to the Immich database, while Immich only handles UI and API display.

## Behavior Summary

| Feature | Config value | What Immich does | Who writes the result |
| --- | --- | --- | --- |
| CLIP / Smart Search | `clip.modelName` set to a numeric dimension such as `"256"`, `"512"`, `"768"`, `"1024"`, `"1536"`, `"2048"`, or `"2560"` | Calls the machine learning HTTP endpoint, but sends `assetId` instead of image bytes | Immich writes `smart_search` |
| OCR | `ocr.modelName: "other"` | Skips OCR jobs entirely | Your external service |
| Faces / People | `facialRecognition.modelName: "other"` | Skips face detection and face recognition jobs entirely | Your external service |

## Configuration

You can configure this in the UI or in the [config file](/install/config-file).

Example:

```json title="immich.json"
{
  "machineLearning": {
    "enabled": true,
    "urls": ["http://your-ml-service:3003"],
    "clip": {
      "enabled": true,
      "modelName": "768"
    },
    "ocr": {
      "enabled": true,
      "modelName": "other",
      "maxResolution": 736,
      "minDetectionScore": 0.5,
      "minRecognitionScore": 0.8
    },
    "facialRecognition": {
      "enabled": true,
      "modelName": "other",
      "minScore": 0.7,
      "minFaces": 3,
      "maxDistance": 0.5
    }
  }
}
```

## CLIP Usage

CLIP stays active in this fork. The main change is transport and vector size:

- Set `machineLearning.clip.modelName` to the embedding dimension as a plain numeric string, for example `768`, `1536`, `2048`, `3072`, or `4096`.
- This is generic. Any positive integer dimension is accepted. Common values are `256`, `512`, `768`, `1024`, `1536`, `2048`, and `2560` for your default external model.
- Immich still queues Smart Search jobs.
- For these numeric model names, the request sent to the external machine learning HTTP service contains `assetId` instead of an uploaded preview image.
- Immich still writes the final embedding to `smart_search`.

This is different from OCR and faces. CLIP is not passive.

### CLIP database notes

- Table: `smart_search`
- Primary key: `assetId`
- Vector column: `embedding`
- Actual vector dimension must match the configured model name

The source schema still declares `smart_search.embedding` as `vector(512)`, but this fork resizes the real database column and index at runtime to match the configured dimension.

## OCR Usage

Set `machineLearning.ocr.modelName` to `other` when OCR results will be written by your own service.

In this mode:

- Immich does not call the machine learning HTTP OCR endpoint.
- Immich does not write `asset_ocr` or `ocr_search`.
- Immich reads OCR rows from the database for display and OCR search.

Your service is responsible for insert, update, delete, and reprocessing behavior.

### OCR tables

`asset_ocr` stores the visible OCR boxes:

| Column | Meaning |
| --- | --- |
| `id` | OCR row id |
| `assetId` | Asset id |
| `x1` `y1` `x2` `y2` `x3` `y3` `x4` `y4` | Normalized quadrilateral coordinates in the range `0..1` |
| `boxScore` | Detection confidence |
| `textScore` | Recognition confidence |
| `text` | OCR text |
| `isVisible` | Whether the text box is visible and should contribute to search |

`ocr_search` stores one aggregated searchable text row per asset:

| Column | Meaning |
| --- | --- |
| `assetId` | Asset id |
| `text` | Aggregated searchable OCR text |

`asset_job_status.ocrAt` is not required for UI rendering, but you should update it if you want the admin queue page to treat the asset as already processed.

```sql title="Mark OCR as completed"
INSERT INTO "asset_job_status" ("assetId", "ocrAt")
VALUES ('<asset-id>', NOW())
ON CONFLICT ("assetId") DO UPDATE
SET "ocrAt" = EXCLUDED."ocrAt";
```

## Facial Recognition Usage

Set `machineLearning.facialRecognition.modelName` to `other` when your own service owns the full face pipeline.

In this mode:

- Immich does not call the machine learning HTTP face endpoint.
- Immich does not create faces, embeddings, people, or clusters.
- Immich does not run the normal facial recognition aggregation flow.
- Immich only displays faces and people that already exist in the database.

Your service becomes responsible for detection, clustering, person creation, feature-face selection, thumbnail generation, and lifecycle updates.

### Face and person tables

`asset_face` stores detected faces:

| Column | Meaning |
| --- | --- |
| `id` | Face id |
| `assetId` | Asset id |
| `personId` | Linked person id, nullable |
| `imageWidth` `imageHeight` | Size of the image space used for the face box |
| `boundingBoxX1` `boundingBoxY1` `boundingBoxX2` `boundingBoxY2` | Face box coordinates in pixels |
| `sourceType` | Recommended value: `machine-learning` |
| `deletedAt` | Soft delete marker |
| `isVisible` | Whether the face is shown in UI |

`person` stores people:

| Column | Meaning |
| --- | --- |
| `id` | Person id |
| `ownerId` | Must match the asset owner for access control and Explore page visibility |
| `name` | Person name |
| `thumbnailPath` | Filesystem path used by the person thumbnail endpoint |
| `isHidden` | Hidden state |
| `birthDate` | Optional birth date |
| `faceAssetId` | Representative face id, references `asset_face.id` |
| `isFavorite` | Favorite state |
| `color` | Optional UI color |

`face_search` stores face embeddings:

| Column | Meaning |
| --- | --- |
| `faceId` | Face id |
| `embedding` | Face vector |

`face_search` is not required for basic display of people/faces, but it is the place to persist face embeddings if your external service also needs similarity search or wants to keep the vectors next to Immich data.

`asset_job_status.facesRecognizedAt` is not required for UI rendering, but you should update it if you want the admin queue page to treat the asset as already processed.

```sql title="Mark face processing as completed"
INSERT INTO "asset_job_status" ("assetId", "facesRecognizedAt")
VALUES ('<asset-id>', NOW())
ON CONFLICT ("assetId") DO UPDATE
SET "facesRecognizedAt" = EXCLUDED."facesRecognizedAt";
```

## Minimal Contract for External Services

For OCR passive mode, your service should maintain:

- `asset_ocr`
- `ocr_search`
- `asset_job_status.ocrAt`

For face passive mode, your service should maintain:

- `asset_face`
- `person`
- `person.faceAssetId`
- `person.thumbnailPath` and the thumbnail file itself
- `asset_job_status.facesRecognizedAt`

For CLIP dimension mode, your service should provide an HTTP endpoint that can resolve `assetId` and compute the embedding, but Immich still owns:

- Smart Search job queueing
- `smart_search` writes
- CLIP vector dimension management

## Operational Notes

- Immich will still enforce normal foreign keys and cascade deletes in PostgreSQL.
- If your external service rewrites OCR or face results, it should also handle replacement of old rows.
- Person thumbnails are file-backed. `person.thumbnailPath` must point to a file readable by the Immich server container, or the person thumbnail endpoint will return `404`.
- For face display, rows with `deletedAt IS NOT NULL` or `isVisible = false` will not appear normally.
- For OCR search, only the text stored in `ocr_search.text` is used by the OCR search filter.

If you need to inspect or debug the database directly, the [Database Queries guide](/guides/database-queries) is a good companion reference.
