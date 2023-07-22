# Hardware Transcoding [Experimental]

This feature allows you to use a GPU or Intel Quick Sync to accelerate transcoding and reduce CPU load.
Note that hardware transcoding is much less efficient for file sizes.
As this is a new feature, it is still experimental and may not work on all systems.

## Supported APIs

- NVENC
  - NVIDIA GPUs
- Quick Sync
  - Intel CPUs
- VAAPI
  - GPUs

## Limitations

- The instructions and configurations here are specific to Docker Compose. Other container engines may require different configuration.
- Only Linux and Windows (through WSL2) servers are supported.
- WSL2 does not support Quick Sync.
- Raspberry Pi is currently not supported.
- Two-pass mode is only supported for NVENC. Other APIs will ignore this setting.
- Only encoding is currently hardware accelerated, so the CPU is still used for software decoding.
  - This is mainly because the original video may not be hardware-decodable.
- Hardware dependent
  - Codec support varies, but H.264 and HEVC are usually supported.
    - Notably, NVIDIA and AMD GPUs do not support VP9 encoding.
  - Newer devices tend to have higher transcoding quality.

## Prerequisites

#### NVIDIA GPU

- You must have the official NVIDIA driver installed on the server.
- On Linux (except for WSL2), you also need to have [NVIDIA Container Runtime](https://github.com/NVIDIA/nvidia-container-runtime/) installed.

## Setup

1. If you do not already have it, download the latest [`hwaccel.yml`][hw-file] file and ensure it's in the same folder as the `docker-compose.yml`.
2. Uncomment the lines that apply to your system and desired usage.
3. In the `docker-compose.yml` under `immich-microservices`, uncomment the lines relating to the `hwaccel.yml` file.
4. Redeploy the `immich-microservices` container with these updated settings.
5. In the Admin page under `FFmpeg settings`, change the hardware acceleration setting to the appropriate option and save.

[hw-file]: https://github.com/immich-app/immich/releases/latest/download/hwaccel.yml