# Image Enrichment

Image enrichment adds optional machine learning jobs that can generate searchable descriptions and tags for image assets, detect NSFW images, or do both. These jobs are disabled by default and can be enabled independently in `Administration > Settings > Machine Learning Settings`.

Image enrichment processes image assets only. It skips deleted, hidden, and locked assets, and it does not change album membership.

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

The private NSFW flag is the source of truth for future privacy features. Tags are searchable metadata, not a security boundary.

## Running Both Jobs

If both settings are enabled, Immich runs NSFW detection first and passes the result into the description and tag prompt. This allows the generated description and tags to remain factual while including visible NSFW reasons when they are supported.

To process existing libraries, go to `Administration > Jobs` and run the `All` action for Image Enrichment. New uploads queue image enrichment after thumbnail generation.

## Hardware and Model Notes

NSFW detection is an ONNX Runtime task. It can use CUDA in the CUDA machine-learning image and OpenVINO in the OpenVINO machine-learning image.

Description and tag generation currently uses OpenVINO GenAI. For CUDA deployments, changing the description model setting alone is not enough; a CUDA-capable VLM backend must be added first. Good model names to expose after adding such a backend are:

| Use case                             | Model name                     |
| ------------------------------------ | ------------------------------ |
| Higher quality descriptions and tags | `Qwen/Qwen2.5-VL-3B-Instruct`  |
| Lower-resource fallback              | `microsoft/Florence-2-base-ft` |
