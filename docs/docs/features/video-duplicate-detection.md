# Video Duplicate Detection

Gallery can automatically detect duplicate videos even when they have been re-encoded, resized, or converted to a different format. It uses the same CLIP-based AI that powers image duplicate detection, extended to work with video content by sampling and averaging multiple frames.

## How It Works

When a video is processed for Smart Search, Gallery extracts multiple frames and encodes each one with CLIP to produce an embedding vector. These per-frame embeddings are averaged into a single representative vector that captures the visual content of the entire video. Two videos with the same visual content produce nearly identical vectors — regardless of codec, resolution, or bitrate.

### Frame Sampling Strategy

The number of frames extracted depends on the video duration:

| Duration        | Frames Extracted                   |
| --------------- | ---------------------------------- |
| Invalid / 0     | 1 frame at the start (t=0)         |
| Under 2 seconds | 1 frame at the midpoint            |
| 2+ seconds      | 8 frames evenly spaced (5% to 95%) |

This adaptive sampling ensures short clips and corrupt videos are still processed, while longer videos get thorough coverage across their timeline.

### Matching Rules

- Videos only match with other videos — never with images.
- The duplicate detection distance threshold is the same one used for image duplicates, configurable in **Administration > Machine Learning Settings**.
- Byte-identical uploads per user are already blocked by checksum deduplication. Video duplicate detection catches re-encoded and resized copies that have completely different bytes but the same visual content.

## Using Video Duplicates

No extra configuration is needed. If Smart Search and Duplicate Detection are already enabled, videos are automatically included the next time the jobs run.

### Reviewing Duplicates

1. Go to **Utilities > Duplicates**.
2. Video duplicates appear in the same list as image duplicates.
3. Review them side by side — file size, resolution, codec, and other metadata are shown.
4. Choose to **keep** the highest quality version and **trash** the rest, or **stack** them together.

### Re-scanning Existing Videos

To detect duplicates in videos uploaded before this feature was available:

1. Go to **Administration > Jobs**.
2. Run the **Smart Search** job for all assets — this generates CLIP embeddings for videos that don't have them yet.
3. Run the **Duplicate Detection** job to find matches.

## Technical Implementation

### Encoding Pipeline

```
┌──────────────────────────────────────────────────────────────────────┐
│  Smart Search Job (per video asset)                                  │
│                                                                      │
│  ┌─────────┐    ┌───────────────┐    ┌───────────────┐              │
│  │ ffprobe │───►│ Calculate     │───►│ Extract       │              │
│  │ duration │    │ timestamps    │    │ frames (JPEG) │              │
│  └─────────┘    │ (8 @ 5%-95%) │    │ via ffmpeg    │              │
│                  └───────────────┘    └───────┬───────┘              │
│                                               │                      │
│                                    ┌──────────▼──────────┐           │
│                                    │ CLIP encode each    │           │
│                                    │ frame (sequential)  │           │
│                                    └──────────┬──────────┘           │
│                                               │                      │
│                                    ┌──────────▼──────────┐           │
│                                    │ Average embeddings  │           │
│                                    │ (element-wise mean) │           │
│                                    └──────────┬──────────┘           │
│                                               │                      │
│                                    ┌──────────▼──────────┐           │
│                                    │ Upsert into         │           │
│                                    │ smart_search table  │           │
│                                    └─────────────────────┘           │
└──────────────────────────────────────────────────────────────────────┘
```

1. **Probe** — `ffprobe` reads the video duration from the container metadata.
2. **Timestamp calculation** — 8 evenly spaced timestamps are generated from 5% to 95% of the duration (adaptive for short/invalid videos as described above).
3. **Frame extraction** — For each timestamp, `ffmpeg -ss <t> -frames:v 1` extracts a single JPEG frame into a temporary directory.
4. **CLIP encoding** — Each extracted frame is sent to the machine learning service's existing `/predict` endpoint. Frames are encoded sequentially to avoid overloading the ML service.
5. **Averaging** — All per-frame embedding vectors are combined using element-wise mean into a single 512-dimensional vector.
6. **Storage** — The averaged vector is upserted into the existing `smart_search` table, the same table used for image embeddings.

### Key Implementation Details

- **No schema changes** — Video embeddings are stored in the same `smart_search` table as image embeddings. One vector per asset.
- **No API changes** — The `GET /duplicates` endpoint and `DuplicateResponseDto` are type-agnostic and work with both image and video duplicate groups.
- **No frontend changes** — Video duplicates appear in the existing Duplicates page. The comparison UI already renders video assets.
- **No ML service changes** — The ML service receives individual frame images via the existing CLIP encoding endpoint.
- **Temp file isolation** — Each job creates a unique temporary directory via `mkdtemp`, preventing collisions when multiple Smart Search jobs run concurrently. The directory is cleaned up in a `finally` block regardless of success or failure.
- **Graceful degradation** — If some frames fail to extract (e.g., seek past end of file), the remaining successful frames are averaged. The job only fails if all frames fail or if `ffprobe` cannot read the video.

### Job Flow

Video duplicate detection reuses the existing job pipeline with no new queues:

1. **Smart Search job** — When processing a video asset, `handleEncodeClip` in `smart-info.service.ts` detects the asset type and branches into the video encoding path (probe, extract frames, encode, average, upsert).
2. **Duplicate Detection job** — The existing `duplicate.service.ts` queues per-asset detection jobs. `duplicate.repository.ts` performs vector similarity search filtered by `asset.type`, so videos only match videos.
3. **No new configuration** — The existing `duplicateDetection` admin settings (enabled toggle, distance threshold) apply to both images and videos.
