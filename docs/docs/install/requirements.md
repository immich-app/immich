---
sidebar_position: 10
---

# Requirements

Hardware and software requirements for Immich

## Software

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

:::note
Immich requires the command `docker compose` - the similarly named `docker-compose` is [deprecated](https://docs.docker.com/compose/migrate/) and is no longer compatible with Immich.
:::

## Hardware

- **OS**: Recommended Linux operating system (Ubuntu, Debian, etc).
  - Windows is supported with [Docker Desktop on Windows](https://docs.docker.com/desktop/install/windows-install/) or [WSL 2](https://docs.docker.com/desktop/wsl/).
  - macOS is supported with [Docker Desktop on Mac](https://docs.docker.com/desktop/install/mac-install/).
- **RAM**: Minimum 4GB, recommended 6GB.
- **CPU**: Minimum 2 cores, recommended 4 cores.
- **Storage**: Recommended Unix-compatible filesystem (EXT4, ZFS, APFS, etc.) with support for user/group ownership and permissions.
  - This can present an issue for Windows users. See [here](/docs/install/environment-variables#supported-filesystems)
    for more details and alternatives.
  - The generation of thumbnails and transcoded video can increase the size of the photo library by 10-20% on average.
  - Network shares are supported for the storage of image and video assets only.
