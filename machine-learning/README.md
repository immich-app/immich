# Immich Machine Learning

- CLIP embeddings
- Facial recognition

# Setup

This project uses [uv](https://docs.astral.sh/uv/getting-started/installation/), so be sure to install it first.
Running `uv sync --extra cpu` will install everything you need in an isolated virtual environment.
CUDA, ROCM and OpenVINO are supported as acceleration APIs. To use them, you can replace `--extra cpu` with either of `--extra cuda`, `--extra rocm` or `--extra openvino`. In the case of CUDA, a [compute capability](https://developer.nvidia.com/cuda-gpus) of 5.2 or higher is required.

To add or remove dependencies, you can use the commands `uv add $PACKAGE_NAME` and `uv remove $PACKAGE_NAME`, respectively.
Be sure to commit the `uv.lock` and `pyproject.toml` files with `uv lock` to reflect any changes in dependencies.

# Image Enrichment Models

This fork adds two optional image enrichment tasks:

- Image descriptions and searchable tags
- NSFW detection

The default image description model is optimized for OpenVINO/iGPU deployments:

| Task | Default setting | Runtime note |
| --- | --- | --- |
| Image descriptions and tags | `Qwen/Qwen2.5-VL-3B-Instruct` | Mapped internally to the OpenVINO-converted `llmware/qwen2.5-vl-3b-ov` model. Requires the OpenVINO machine-learning image/extra. |
| Image description fallback | `microsoft/Florence-2-base-ft` | Lower-resource fallback, still loaded through the OpenVINO GenAI path in this branch. |
| NSFW detection | `onnx-community/nsfw_image_detection-ONNX` | ONNX Runtime model. Uses CUDA when running the CUDA machine-learning image/extra and CUDA is available; uses OpenVINO when running the OpenVINO image/extra. |

## CUDA Model Notes

Existing Immich ONNX tasks keep their NVIDIA support. The provider order still prefers `CUDAExecutionProvider` before `OpenVINOExecutionProvider` when the CUDA runtime is installed.

For CUDA deployments:

- Smart search, facial recognition, OCR, and NSFW detection can continue using their normal model settings.
- NSFW detection should use `onnx-community/nsfw_image_detection-ONNX`.
- Image descriptions and tags currently use OpenVINO GenAI. Merely changing the model name is not enough to make the VLM run on CUDA.

If you want CUDA support for image descriptions/tags, add a CUDA-capable VLM backend first, then use one of these model settings as the admin-configurable model name:

| Use case | CUDA-capable model name to expose | Backend needed |
| --- | --- | --- |
| Higher quality descriptions/tags | `Qwen/Qwen2.5-VL-3B-Instruct` | Transformers, vLLM, or another CUDA VLM runner |
| Lower-resource fallback | `microsoft/Florence-2-base-ft` | Transformers or another CUDA-capable Florence-2 runner |

In short: CUDA users can change the NSFW model setting today without losing NVIDIA acceleration. Description/tag generation needs a separate CUDA VLM implementation before the model setting alone will work.

# Load Testing

To measure inference throughput and latency, you can use [Locust](https://locust.io/) using the provided `locustfile.py`.
Locust works by querying the model endpoints and aggregating their statistics, meaning the app must be deployed.
You can change the models or adjust options like score thresholds through the Locust UI.

To get started, you can simply run `locust --web-host 127.0.0.1` and open `localhost:8089` in a browser to access the UI. See the [Locust documentation](https://docs.locust.io/en/stable/index.html) for more info on running Locust.

Note that in Locust's jargon, concurrency is measured in `users`, and each user runs one task at a time. To achieve a particular per-endpoint concurrency, multiply that number by the number of endpoints to be queried. For example, if there are 3 endpoints and you want each of them to receive 8 requests at a time, you should set the number of users to 24.

# Facial Recognition

## Acknowledgements

This project utilizes facial recognition models from the [InsightFace](https://github.com/deepinsight/insightface/tree/master/model_zoo) project. We appreciate the work put into developing these models, which have been beneficial to the machine learning part of this project.

### Used Models

- antelopev2
- buffalo_l
- buffalo_m
- buffalo_s

## License and Use Restrictions

We have received permission to use the InsightFace facial recognition models in our project, as granted via email by Jia Guo (guojia@insightface.ai) on 18th March 2023. However, it's important to note that this permission does not extend to the redistribution or commercial use of their models by third parties. Users and developers interested in using these models should review the licensing terms provided in the InsightFace GitHub repository.

For more information on the capabilities of the InsightFace models and to ensure compliance with their license, please refer to their [official repository](https://github.com/deepinsight/insightface). Adhering to the specified licensing terms is crucial for the respectful and lawful use of their work.
