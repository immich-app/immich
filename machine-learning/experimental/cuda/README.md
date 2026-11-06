# Experimental CUDA wheel recipe

This recipe builds an optional machine-learning image using a locally supplied ONNX Runtime CUDA wheel. It is separate from the standard images and release workflow. It does not change the supported GPU requirements of the published CUDA image.

Use a parent CUDA image built from the same checkout, including the optional TensorRT RTX, unified-stream and arena-shrinkage settings. The recipe enables a memory profile for CUDA execution and disables TensorRT RTX registration. CPU, video processing, job concurrency and model selection are not configured by this recipe.

## Requirements

The supplied wheel must have a reviewed build record and match all of the following:

- ONNX Runtime 1.27.1, Linux x86_64 and the parent image's Python 3.13 ABI.
- CUDA 12.2 and cuDNN 9.10.2.21, matching the current CUDA image.
- CUDA kernels for the intended GPU's compute capability, with compatible CUDA libraries and host driver.
- NumPy 2 compatibility, as required by the application.

The build checks the supplied SHA256, distribution version, interpreter/ABI/platform tags, runtime library versions and CUDA provider selection. These checks do not establish the wheel's architecture coverage, provenance or successful inference on a GPU. Use the reviewed build record to verify its compiler flags, source revisions, patches and included CUDA architectures.

For a GeForce 940MX with the GM108 chip, the relevant architecture is `sm_50`. An ordinary CUDA wheel may omit this architecture. Enabling these settings or changing an image tag cannot add the missing kernels.

A source build for this older GPU can also require compatibility patches in ONNX Runtime and its dependencies; setting `CMAKE_CUDA_ARCHITECTURES=50` alone is not a complete build procedure. Keep the source build and its provenance separate from this image recipe. No prebuilt wheel or ONNX Runtime source tree is distributed here.

Other NVIDIA GPUs may use this recipe with an appropriately built wheel. Matching the CUDA major version alone is insufficient: check the GPU's compute capability, wheel architecture coverage, Python ABI, CUDA/cuDNN versions and driver, then validate that device. A newer GPU or driver also does not guarantee compatibility with the pinned CUDA 12.2/cuDNN stack. Results from one GPU do not establish compatibility with another GPU or with every model.

## Build

From the repository root, build the parent from this checkout:

```sh
docker build --build-arg DEVICE=cuda \
  -f machine-learning/Dockerfile \
  -t immich-machine-learning:local-cuda machine-learning
```

Copy the reviewed wheel into this directory, then build using its original filename and the SHA256 recorded by its build:

```sh
cd machine-learning/experimental/cuda
docker build \
  --build-arg IMMICH_ML_IMAGE=immich-machine-learning:local-cuda \
  --build-arg ORT_WHEEL=onnxruntime_gpu-1.27.1-cp313-cp313-linux_x86_64.whl \
  --build-arg ORT_WHEEL_SHA256=REPLACE_WITH_REVIEWED_WHEEL_SHA256 \
  -t immich-machine-learning:local-cuda-custom .
```

The wheel installation runs without network access and replaces only `onnxruntime-gpu`, without resolving or updating other dependencies. GPU hardware is not required to build the image. This recipe requires BuildKit.

Use `immich-machine-learning:local-cuda-custom` as the machine-learning service image together with the existing CUDA device configuration. Keep a matching CPU backend available if needed. To return to the normal CUDA image, select the normal image again and remove any experimental environment overrides.

## Enabled settings

| Setting | Experimental image | Application default |
| --- | --- | --- |
| `MACHINE_LEARNING_TENSORRT_RTX` | `false` | `true` |
| `MACHINE_LEARNING_CUDA_USE_EP_LEVEL_UNIFIED_STREAM` | `true` | `false` |
| `MACHINE_LEARNING_CUDA_ARENA_SHRINKAGE` | `true` | `false` |
| `CUBLAS_WORKSPACE_CONFIG` | `:16:8` | Not set by the standard image |

The unified stream reuses CUDA execution-provider stream resources. Arena shrinkage requests release of unused CUDA arena allocations after inference when the application creates default run options; caller-supplied run options retain their behavior. It does not unload the model or impose a GPU memory cap. The cuBLAS workspace setting uses a smaller workspace pool. These choices can affect performance, so measure them with the intended workload.

## Validate on the target GPU

Before selecting this image for normal use, test real inference on the intended GPU:

1. Check installed runtime versions and successful CUDA execution of simple operators with CPU fallback disabled.
2. Exercise text search, image embeddings, facial detection/recognition and OCR with the intended models, including cold and repeated warm requests.
3. Use ONNX Runtime profiles to confirm substantial model operations execute on CUDA. Shape or copy operations on CPU do not by themselves indicate total CPU fallback.
4. Compare embeddings and recognition results with the CPU backend, then exercise the normal concurrent request mix while monitoring GPU memory and errors.
5. Measure performance without profiling. Preserve ordinary application settings when comparing backends.

A separate Immich 3.3.6 deployment with a source-built ONNX Runtime 1.27.1 wheel was tested on a GM108 GeForce 940MX with 2 GiB VRAM. The six default model sessions executed substantial CUDA operations; eight six-client suites completed 48 requests, with a measured peak of 1120 MiB for that workload. This is prior device-specific evidence, not validation of this checkout or a memory guarantee for other models. Revalidate a newly built image, changed models or a changed software stack.

This recipe supports machine-learning experimentation only. It does not provide NVDEC/NVENC support or install the separate academic H.264 decoder prototype.

## References

- [Immich machine-learning hardware acceleration](https://docs.immich.app/features/ml-hardware-acceleration/)
- [ONNX Runtime CUDA execution provider options](https://onnxruntime.ai/docs/execution-providers/CUDA-ExecutionProvider.html)
- [ONNX Runtime arena-shrinkage run option](https://github.com/microsoft/onnxruntime/blob/v1.27.1/include/onnxruntime/core/session/onnxruntime_run_options_config_keys.h)
- [NVIDIA cuBLAS workspace configuration](https://docs.nvidia.com/cuda/cublas/index.html#results-reproducibility)
- [NVIDIA cuDNN 9.10.2 support matrix](https://docs.nvidia.com/deeplearning/cudnn/backend/v9.10.2/reference/support-matrix.html)
