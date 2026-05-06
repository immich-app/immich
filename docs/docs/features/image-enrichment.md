# Image Enrichment

Image enrichment adds optional machine learning jobs that can generate searchable descriptions and tags for image assets, detect NSFW images, or do both. These jobs are disabled by default and can be enabled independently in `Administration > Settings > Machine Learning Settings`.

Image enrichment processes image assets only. It skips deleted, hidden, and locked assets, and it does not change album membership.

## Recommended Rollout

For an existing library, enable and backfill one task at a time:

1. Enable `Detect NSFW images` first and run `Administration > Jobs > Image Enrichment > All`.
2. Review the generated `nsfw` tags and tune the threshold if needed.
3. Enable `Generate AI descriptions and tags` and run the Image Enrichment job again.
4. Enable `Hide detected NSFW assets` only after the classifier results look acceptable for your library.

New uploads are queued automatically after thumbnail generation when the relevant setting is enabled.

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

When `Hide detected NSFW assets` is enabled, privately flagged NSFW assets are hidden from library views such as the timeline, search results, albums, album thumbnails and counts, maps, and direct asset access unless the current session has been unlocked with the locked-folder PIN. Album membership is preserved; hiding only changes what is returned to a non-elevated session.

Locked-folder behavior is session based. Unlocking the locked folder elevates the current session so flagged NSFW assets can be returned again; logging out or using another session requires unlocking again.

## Running Both Jobs

If both settings are enabled, Immich runs NSFW detection first and passes the result into the description and tag prompt. This allows the generated description and tags to remain factual while including visible NSFW reasons when they are supported.

To process existing libraries, go to `Administration > Jobs` and run the `All` action for Image Enrichment. The job page queues only enabled enrichment tasks. If both tasks are enabled, the NSFW queue-all job and the description queue-all job are both scheduled; individual description jobs reuse a stored NSFW result or run NSFW detection first when one is missing.

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
