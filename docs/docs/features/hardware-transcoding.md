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

#### NVENC

- You must have the official NVIDIA driver installed on the server.
- On Linux (except for WSL2), you also need to have [NVIDIA Container Runtime][nvcr] installed.

#### QSV

- For VP9 to work:
  - You must have a 9th gen Intel CPU or newer
  - If you have an 11th gen CPU or older, then you may need to follow [these][jellyfin-lp] instructions as Low-Power mode is required
  - Additionally, if the server specifically has an 11th gen CPU and is running kernel 5.15 (shipped with Ubuntu 22.04 LTS), then you will need to upgrade this kernel (from [Jellyfin docs][jellyfin-kernel-bug])

## Setup

1. If you do not already have it, download the latest [`hwaccel.yml`][hw-file] file and ensure it's in the same folder as the `docker-compose.yml`.
2. Uncomment the lines that apply to your system and desired usage.
3. In the `docker-compose.yml` under `immich-microservices`, uncomment the lines relating to the `hwaccel.yml` file.
4. Redeploy the `immich-microservices` container with these updated settings.
5. In the Admin page under `FFmpeg settings`, change the hardware acceleration setting to the appropriate option and save.

## Tips

- You may want to choose a slower preset than for software transcoding to maintain quality and efficiency
- While you can use VAAPI with Nvidia GPUs and Intel CPUs, prefer the more specific APIs since they're more optimized for their respective devices

[hw-file]: https://github.com/immich-app/immich/releases/latest/download/hwaccel.yml
[nvcr]: https://github.com/NVIDIA/nvidia-container-runtime/
[jellyfin-lp]: https://jellyfin.org/docs/general/administration/hardware-acceleration/intel/#configure-and-verify-lp-mode-on-linux
[jellyfin-kernel-bug]: https://jellyfin.org/docs/general/administration/hardware-acceleration/intel/#known-issues-and-limitations
