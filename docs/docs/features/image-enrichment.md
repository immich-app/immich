# Image Enrichment

Image enrichment adds optional machine learning jobs that can generate searchable descriptions and tags for image assets, detect NSFW images, or do both. These jobs are disabled by default and can be enabled independently in `Administration > Settings > Machine Learning Settings`.

Image enrichment processes image assets only. It skips deleted, hidden, and locked assets, and it does not change album membership.

## Recommended Rollout

For an existing library, enable and backfill one task at a time:

1. Enable `Detect NSFW images` first and run `Administration > Jobs > NSFW Detection > All`.
2. Review the generated `nsfw` tags and tune the threshold if needed.
3. Enable `Generate AI descriptions and tags` and run `Administration > Jobs > Image descriptions and tags > All`.
4. Enable `Hide detected NSFW assets` only after the classifier results look acceptable for your library.

New uploads are queued automatically after thumbnail generation when the relevant setting is enabled.

## Review and Repair

Admins can review enrichment results from the asset detail panel. The `Image enrichment` section shows the stored model status, model name, NSFW score, labels, review state, and last error when a task fails.

Available single-asset repair actions are:

- Rerun image descriptions and tags.
- Rerun NSFW detection.
- Accept the current NSFW classifier result.
- Mark an asset as safe or NSFW using a private review override.
- Clear the generated `AI description:` block without removing user-written description text.
- Clear generated tags from the asset without deleting the tag definitions.

Review overrides are stored in private enrichment metadata and become the effective NSFW source of truth for hiding. Generated tags remain visible search metadata only.

Admins can also use the search filter modal to find enrichment review sets, including NSFW assets, assets needing NSFW review, reviewed or overridden NSFW assets, failed enrichment jobs, and image assets missing description or NSFW results. If `Hide detected NSFW assets` is enabled, unlock the locked folder PIN session before searching hidden NSFW review sets.

## QA Checklist

Use this checklist when validating image enrichment against a real library or local ML service:

1. Enable `Generate AI descriptions and tags` only, upload a new image, and confirm an `ImageDescription` job is queued after thumbnail generation.
2. Enable `Detect NSFW images` only, upload a new image, and confirm an `NsfwDetection` job is queued after thumbnail generation.
3. Enable both settings, upload a new image, and confirm only `ImageDescription` is queued directly after thumbnail generation. The description job runs NSFW detection first and passes that result to the description model.
4. Run `NSFW Detection > All` and `Image descriptions and tags > All` from `Administration > Jobs`, then confirm video, hidden, locked, deleted, and already-successful images are skipped unless the run is forced.
5. Open an enriched image's detail panel and verify the private status, model name, labels, score, review state, and errors are visible to admins.
6. Use the search filter modal to review `NSFW`, `NSFW review`, `NSFW reviewed`, `NSFW overridden`, failed, and missing-result states.
7. Confirm generated descriptions append only one `AI description:` block and never remove user-written text.
8. Confirm generated tags are lowercase, deduplicated, searchable, and removable through the repair action without deleting tag definitions.
9. For NSFW assets, confirm the private effective NSFW flag drives hiding behavior while tags remain visible metadata only.
10. With `Hide detected NSFW assets` enabled, confirm non-elevated sync streams exclude private NSFW assets, album asset relations, person face thumbnails, partner assets, stacks, and generic asset metadata.
11. Unlock the locked-folder PIN session and confirm the same assets and album memberships are returned again without changing album membership.

## Descriptions and Tags

When description and tag generation is enabled, Immich sends the asset preview image to the machine learning service and stores the model result as private enrichment metadata. Immich then applies visible metadata according to the admin settings:

- Descriptions are written to the asset description field.
- Existing user descriptions are preserved, with a generated block appended once.
- Tags are plain searchable tags, deduplicated against existing tags.
- Sidecar write jobs are queued after visible description or tag changes.

The default description model setting is `Qwen/Qwen2.5-VL-3B-Instruct`. In this branch, that model is mapped internally to the OpenVINO-converted `llmware/qwen2.5-vl-3b-ov` model. The lower-resource fallback setting is `microsoft/Florence-2-base-ft`.

## NSFW Detection

When NSFW detection is enabled, Immich sends the asset preview image to a dedicated classifier. The private enrichment metadata stores the NSFW flag, score, labels, model name, status, and timestamps.

The default NSFW model is `onnx-community/nsfw_image_detection-ONNX`, with a default threshold of `0.85`. When an image is detected as NSFW, Immich can add an `nsfw` tag and specific visible reason tags when they are supported by the classifier result and the visible image content.

The private NSFW flag is the source of truth for privacy features. Tags are searchable metadata, not a security boundary.

When `Hide detected NSFW assets` is enabled, privately flagged NSFW assets are hidden from library views such as the timeline, search results, albums, album thumbnails and counts, maps, shared-link payloads, downloads, and direct asset access unless the current session has been unlocked with the locked-folder PIN.

Sync streams apply the same private NSFW filter to asset payloads, album asset payloads, album-to-asset relations, exif, edit, face, memory, partner, and stack payloads, album thumbnails, person face thumbnails, and generic asset metadata. Private `ml-enrichment` metadata is never exposed through generic asset metadata sync.

Album membership is preserved; hiding only changes what is returned to a non-elevated session. Sync clients should treat hidden assets as privacy-filtered results, not album membership removals.

Locked-folder behavior is session based. Unlocking the locked folder elevates the current session so flagged NSFW assets can be returned again; logging out or using another session requires unlocking again.

## Running Both Jobs

If both settings are enabled, Immich runs NSFW detection first and passes the result into the description and tag prompt. This allows the generated description and tags to remain factual while including visible NSFW reasons when they are supported.

To process existing libraries, go to `Administration > Jobs` and run the `All` action for the specific enrichment task you want to backfill. Use `NSFW Detection` first if you want classifier results available before description/tag generation, then run `Image descriptions and tags`. The legacy `Image Enrichment` queue command still queues every enabled enrichment task for API compatibility, but the admin Jobs page exposes the two backfills separately.

Backfills skip images that already have a successful result for the selected task unless the job is forced. A forced run recalculates the selected task, but visible descriptions and tags are still protected by stored applied hashes so generated metadata is not appended repeatedly.

Single-asset jobs also re-check eligibility before calling machine learning. If an asset is deleted, trashed, hidden, locked, missing a preview, or no longer an image, the job is skipped or failed without applying metadata.

## Visible Metadata

Descriptions and tags are applied after the private model result is stored:

- Descriptions are appended to the existing description as an `AI description:` block.
- Existing user text is never overwritten.
- Tags are normalized to lowercase searchable values.
- NSFW images receive `nsfw` plus classifier-supported reason tags when visible evidence supports them.
- Sidecar write jobs are queued after visible metadata changes.

## Hardware and Model Notes

NSFW detection is an ONNX Runtime task. It can use CUDA in the CUDA machine-learning image and OpenVINO in the OpenVINO machine-learning image.

Description and tag generation currently uses OpenVINO GenAI. For CUDA deployments, changing the description model setting alone is not enough; a CUDA-capable VLM backend must be added first. Good model names to expose after adding such a backend are:

| Use case                             | Model name                     |
| ------------------------------------ | ------------------------------ |
| Higher quality descriptions and tags | `Qwen/Qwen2.5-VL-3B-Instruct`  |
| Lower-resource fallback              | `microsoft/Florence-2-base-ft` |

For Intel iGPU deployments, use the OpenVINO machine-learning image/extra and keep the description device at `AUTO` unless you need to pin it. `AUTO` lets OpenVINO choose the best available device and fall back when the GPU is unavailable.

For NVIDIA deployments, CUDA continues to accelerate existing ONNX tasks such as Smart Search, facial recognition, OCR, duplicate detection, and NSFW detection. Description/tag generation needs a CUDA-capable VLM backend before it can run on NVIDIA GPUs.
