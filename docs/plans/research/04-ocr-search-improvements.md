# Feature Research: OCR Search Improvements

**Votes:** 319 (7th most requested)
**Status:** Partially shipped — full pipeline works but has performance/memory concerns
**Upstream Work:** Active — PP-OCRv5 models, CJK bigram tokenization, bounding box UI

## Overview

Search photos by text visible in them (signs, documents, screenshots, etc.). The OCR pipeline is fully functional in current Immich with detection, recognition, and search integration. The main improvement areas are performance, memory management, and UX refinements.

## Current Architecture

### Machine Learning Pipeline

**Two-stage processing** (`machine-learning/immich_ml/models/ocr/`):

1. **Text Detection** (`detection.py`):
   - Model: RapidOCR PP-OCRv5 (mobile or server variant)
   - ONNX Runtime inference
   - Outputs normalized bounding boxes (8 coordinates) + confidence scores
   - Max resolution: 736px (mobile), configurable for server model

2. **Text Recognition** (`recognition.py`):
   - Model: PP-OCRv5 with language support (CH, EN, JA, KO, etc.)
   - Batch processing (default batch size: 6)
   - Perspective transform on cropped regions
   - Auto-rotation for vertical text
   - Returns text + confidence scores

**Configuration** (`OcrConfig`):

- `maxResolution`, `minDetectionScore`, `minRecognitionScore`
- `modelName` (PP-OCRv5_mobile / PP-OCRv5_server)
- `fp16` and `preload` for performance tuning

### Server Pipeline

**Job System** (`server/src/services/ocr.service.ts`):

- `OcrQueueAll` — batch queuing (1000 assets per flush)
- `Ocr` — per-asset processing using preview/thumbnail (not original)
- Skips: hidden assets, assets without previews, disabled configs

**Data Storage — Two Tables:**

1. **`asset_ocr`** — Full OCR result data:
   - Per-box: `id`, `assetId`, 8 normalized coordinates, `boxScore`, `textScore`, `text`
   - `isVisible` toggle per box (default: true)
   - Index: `asset_ocr_assetId_idx`

2. **`ocr_search`** — Text search index:
   - Per-asset: `assetId` PK, concatenated tokenized text
   - CJK bigram tokenization (Chinese, Japanese, Korean)
   - PostgreSQL GIN index on `f_unaccent(text)` with `gin_trgm_ops`
   - Used for `%>>` (trigram similarity) queries

**Search Integration** (`server/src/utils/database.ts`):

```sql
INNER JOIN ocr_search ON asset.id = ocr_search.assetId
WHERE f_unaccent(ocr_search.text) %>> f_unaccent(${tokenized_query})
```

Case-insensitive + accent-insensitive fuzzy matching.

### Web UI

**OCR Manager** (`web/src/lib/stores/ocr.svelte.ts`):

- Singleton using Svelte 5 runes (`$state`, `$derived`)
- `CancellableTask` wrapper for request cancellation
- Caching via `AssetCacheManager` (in-memory Map)

**Components:**

- `ocr-button.svelte` — Toggle overlay visibility
- `ocr-bounding-box.svelte` — Per-box overlay with CSS `matrix3d` transforms
- Hover state shows text on dark background, selectable for copy-paste

## Known Issues & Improvement Opportunities

### 1. Web Cache Memory Growth (Medium Priority)

**Problem:** `AssetCacheManager` uses unbounded Map storage — no eviction policy. Cache grows indefinitely as user navigates through assets with OCR data.

**Fix:** Implement LRU cache with configurable max entries (e.g., 100 assets). Evict oldest entries when limit reached.

**Effort:** Small (1-2 days)

### 2. Matrix Calculation Performance (Low Priority)

**Problem:** `calculateBoundingBoxMatrix()` uses SVD-based homography calculation for each bounding box, recalculated on every render. Not memoized.

**Fix:** Memoize matrix results keyed by box coordinates. Only recalculate when coordinates or container dimensions change.

**Effort:** Small (< 1 day)

### 3. Batch Search Optimization (Medium Priority)

**Problem:** Trigram similarity queries can be slow for large libraries with many OCR results.

**Potential Fix:**

- Add index on `asset_ocr.text` for direct text queries
- Consider full-text search (tsvector) as complement to trigram similarity
- Pre-filter by asset date range or location for scoped searches

**Effort:** Medium (3-5 days)

### 4. OCR Result Filtering UI (Medium Priority)

**Problem:** No way to filter OCR results by confidence score in the viewer. Low-confidence boxes clutter the overlay.

**Fix:** Add confidence threshold slider in OCR overlay UI. Filter boxes client-side by `boxScore` and `textScore`.

**Effort:** Small-Medium (2-3 days)

### 5. Incremental Re-indexing (Low Priority)

**Problem:** Rebuilding `ocr_search` index requires full truncate/rebuild.

**Fix:** Update `ocr_search` row only for affected assets when OCR re-runs (already partially implemented via upsert).

**Effort:** Small (1-2 days)

### 6. ML Memory Pooling (Medium Priority)

**Problem:** ML service creates numpy arrays per-request, increasing GC pressure during batch processing.

**Fix:** Pre-allocate reusable numpy arrays in ML service. Pool image buffers across requests.

**Effort:** Medium (3-5 days, requires ML expertise)

### 7. Multi-Language Model Selection (Feature)

**Problem:** Model language must be globally configured. Users with multi-language photo libraries can't optimize for all languages simultaneously.

**Fix:** Allow per-asset or per-library language model selection. Or run multiple language models and merge results.

**Effort:** Large (1-2 weeks, significant ML pipeline changes)

### 8. Document Scan Mode (Feature)

**Problem:** OCR is optimized for natural scene text (signs, labels). Documents benefit from different preprocessing (deskewing, binarization).

**Fix:** Add document scan mode with preprocessing pipeline. Could be triggered by aspect ratio heuristic (portrait, high text density).

**Effort:** Large (2+ weeks)

## Recommended Priority

| Improvement               | Effort       | Impact | Priority |
| ------------------------- | ------------ | ------ | -------- |
| LRU cache for OCR data    | Small        | Medium | P1       |
| Confidence threshold UI   | Small-Medium | Medium | P1       |
| Matrix memoization        | Small        | Low    | P2       |
| Batch search optimization | Medium       | High   | P2       |
| ML memory pooling         | Medium       | Medium | P3       |
| Multi-language models     | Large        | Medium | P3       |
| Document scan mode        | Large        | Medium | P4       |

## Effort Estimate

**Quick wins (P1):** ~3-5 days — cache eviction + confidence UI
**Medium improvements (P2):** ~1-2 weeks — search optimization + memoization
**Full feature work (P3-P4):** ~3-4 weeks — ML pipeline changes

## Key Files

- ML detection: `machine-learning/immich_ml/models/ocr/detection.py`
- ML recognition: `machine-learning/immich_ml/models/ocr/recognition.py`
- Server service: `server/src/services/ocr.service.ts`
- Server repository: `server/src/repositories/ocr.repository.ts`
- DB schema: `server/src/schema/tables/asset-ocr.table.ts`, `ocr-search.table.ts`
- Web manager: `web/src/lib/stores/ocr.svelte.ts`
- Web cache: `web/src/lib/managers/AssetCacheManager.svelte.ts`
- Web utils: `web/src/lib/utils/ocr-utils.ts`
- Search integration: `server/src/utils/database.ts` (trigram query)
