# Hardware acceleration support

Immich can offload video transcoding and machine learning to a GPU. The two use different backends and have different constraints, listed separately below.

Setup instructions are in [Set up hardware transcoding](/administration/set-up-hardware-transcoding) and [Set up hardware-accelerated machine learning](/administration/set-up-hardware-accelerated-machine-learning).

## Transcoding

### Supported APIs

- NVENC (NVIDIA)
- Quick Sync (Intel)
- RKMPP (Rockchip)
- VAAPI (AMD / NVIDIA / Intel)

### Limitations

- The instructions and configurations here are specific to Docker Compose. Other container engines may require different configuration.
- Only Linux and Windows (through WSL2) servers are supported.
- WSL2 does not support Quick Sync.
- Raspberry Pi is currently not supported.
- Two-pass mode is only supported for NVENC. Other APIs will ignore this setting.
- By default, only encoding is currently hardware accelerated. This means the CPU is still used for software decoding and tone-mapping.
  - You can benefit from end-to-end acceleration by enabling hardware decoding in the video transcoding settings.
- Hardware dependent
  - Codec support varies, but H.264 and HEVC are usually supported.
    - Notably, NVIDIA and AMD GPUs do not support VP9 encoding.
  - Newer devices tend to have higher transcoding quality.

## Machine learning

### Supported backends

- ARM NN (Mali)
- CUDA (NVIDIA GPUs with [compute capability](https://developer.nvidia.com/cuda-gpus) 5.2 or higher)
- ROCm (AMD GPUs)
- OpenVINO (Intel GPUs such as Iris Xe and Arc)
- RKNN (Rockchip)

### Limitations

- The instructions and configurations here are specific to Docker Compose. Other container engines may require different configuration.
- Only Linux and Windows (through WSL2) servers are supported.
- ARM NN is only supported on devices with Mali GPUs. Other Arm devices are not supported.
- Some models may not be compatible with certain backends. CUDA is the most reliable.
- Search latency isn't improved by ARM NN due to model compatibility issues preventing its use. However, smart search jobs do make use of ARM NN.
