# Hardware Transcoding [Experimental]

This feature allows you to use a GPU to accelerate transcoding and reduce CPU load.
Note that hardware transcoding is much less efficient for file sizes.
As this is a new feature, it is still experimental and may not work on all systems.

:::info
You do not need to redo any transcoding jobs after enabling hardware acceleration. The acceleration device will be used for any jobs that run after enabling it.
:::

## Supported APIs

- NVENC (NVIDIA)
- Quick Sync (Intel)
- RKMPP (Rockchip)
- VAAPI (AMD / NVIDIA / Intel)

## Limitations

- The instructions and configurations here are specific to Docker Compose. Other container engines may require different configuration.
- Only Linux and Windows (through WSL2) servers are supported.
- WSL2 does not support Quick Sync.
- Raspberry Pi is currently not supported.
- Two-pass mode is only supported for NVENC. Other APIs will ignore this setting.
- By default, only encoding is currently hardware accelerated. This means the CPU is still used for software decoding and tone-mapping.
  - NVENC and RKMPP can be fully accelerated by enabling hardware decoding in the video transcoding settings.
- Hardware dependent
  - Codec support varies, but H.264 and HEVC are usually supported.
    - Notably, NVIDIA and AMD GPUs do not support VP9 encoding.
  - Newer devices tend to have higher transcoding quality.

## Prerequisites

#### NVENC

- You must have the official NVIDIA driver installed on the server.
- On Linux (except for WSL2), you also need to have [NVIDIA Container Toolkit][nvct] installed.

#### QSV

- For VP9 to work:
  - You must have a 9th gen Intel CPU or newer
  - If you have an 11th gen CPU or older, then you may need to follow [these][jellyfin-lp] instructions as Low-Power mode is required
  - Additionally, if the server specifically has an 11th gen CPU and is running kernel 5.15 (shipped with Ubuntu 22.04 LTS), then you will need to upgrade this kernel (from [Jellyfin docs][jellyfin-kernel-bug])

#### RKMPP

For RKMPP to work:

- You must have a supported Rockchip ARM SoC.
- Only RK3588 supports hardware tonemapping, other SoCs use slower software tonemapping while still using hardware encoding.
- Tonemapping requires `/usr/lib/aarch64-linux-gnu/libmali.so.1` to be present on your host system. Install the [`libmali`][libmali-rockchip] release that corresponds to your Mali GPU (`libmali-valhall-g610-g13p0-gbm` on RK3588) and modify the [`hwaccel.transcoding.yml`][hw-file] file:
  - under `rkmpp` uncomment the 3 lines required for OpenCL tonemapping by removing the `#` symbol at the beginning of each line
  - `- /dev/mali0:/dev/mali0`
  - `- /etc/OpenCL:/etc/OpenCL:ro`
  - `- /usr/lib/aarch64-linux-gnu/libmali.so.1:/usr/lib/aarch64-linux-gnu/libmali.so.1:ro`

## Setup

#### Basic Setup

1. If you do not already have it, download the latest [`hwaccel.transcoding.yml`][hw-file] file and ensure it's in the same folder as the `docker-compose.yml`.
2. In the `docker-compose.yml` under `immich-server`, uncomment the `extends` section and change `cpu` to the appropriate backend.

- For VAAPI on WSL2, be sure to use `vaapi-wsl` rather than `vaapi`

3. Redeploy the `immich-server` container with these updated settings.
4. In the Admin page under `Video transcoding settings`, change the hardware acceleration setting to the appropriate option and save.
5. (Optional) If using a compatible backend, you may enable hardware decoding for optimal performance.

#### Single Compose File

Some platforms, including Unraid and Portainer, do not support multiple Compose files as of writing. As an alternative, you can "inline" the relevant contents of the [`hwaccel.transcoding.yml`][hw-file] file into the `immich-server` service directly.

For example, the `qsv` section in this file is:

```yaml
devices:
  - /dev/dri:/dev/dri
```

You can add this to the `immich-server` service instead of extending from `hwaccel.transcoding.yml`:

```yaml
immich-server:
  container_name: immich_server
  image: ghcr.io/immich-app/immich-server:${IMMICH_VERSION:-release}
  # Note the lack of an `extends` section
  devices:
    - /dev/dri:/dev/dri
  volumes:
  ...
```

Once this is done, you can continue to step 3 of "Basic Setup".

#### All-In-One - Unraid Setup

##### QSV

1. Unraid > Docker > (Stop) Immich container > Edit
2. Scroll down and select `Add another Path, Port, Variable, Label or Device`
3. In the drop-down menu, select `Device` and an entry with any name and the value `/dev/dri`.
4. Continue to step 4 of "Basic Setup".

##### NVENC

1. In the container app, add this environmental variable: Key=`NVIDIA_VISIBLE_DEVICES` Value=`all`
2. While still in the container app, change the container from Basic Mode to Advanced Mode and add the following parameter to the Extra Parameters field: `--runtime=nvidia`
3. Restart the container app.
4. Continue to step 4 of "Basic Setup".

## Tips

- You may want to choose a slower preset than for software transcoding to maintain quality and efficiency
- While you can use VAAPI with NVIDIA and Intel devices, prefer the more specific APIs since they're more optimized for their respective devices
- You can confirm the device is being recognized and used by checking its utilization (via `nvtop` for NVIDIA, `intel_gpu_top` for Intel, etc.) when transcoding. A lack of error logs when transcoding also indicates that it's being used.

[hw-file]: https://github.com/immich-app/immich/releases/latest/download/hwaccel.transcoding.yml
[nvct]: https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html
[jellyfin-lp]: https://jellyfin.org/docs/general/administration/hardware-acceleration/intel/#configure-and-verify-lp-mode-on-linux
[jellyfin-kernel-bug]: https://jellyfin.org/docs/general/administration/hardware-acceleration/intel/#known-issues-and-limitations
[libmali-rockchip]: https://github.com/tsukumijima/libmali-rockchip/releases
