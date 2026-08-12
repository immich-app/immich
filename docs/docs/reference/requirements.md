---
sidebar_position: 10
---

# Requirements

This page lists the software and hardware requirements for running Immich.

## Software

Immich is distributed as a set of Docker images. Running them requires [Docker](/reference/docker) with the [Docker Compose](https://docs.docker.com/compose/) plugin.

:::info
`docker compose` and `docker-compose` are two different distributions of Docker Compose, with the latter being [deprecated](https://docs.docker.com/retired/#docker-compose-v1-replaced-by-compose-v2) and no longer supported. Make sure that you are installing and using `docker compose`.
:::

### Special requirements for Windows users

<details>
<summary>Database storage on Windows systems</summary>

The Immich Postgres database (`DB_DATA_LOCATION`) must be located on a filesystem that supports user/group
ownership and permissions (EXT2/3/4, ZFS, APFS, BTRFS, XFS, etc.). It will not work on any filesystem formatted in NTFS or ex/FAT/32.
It will not work in WSL (Windows Subsystem for Linux) when using a mounted host directory (commonly under `/mnt`).
If this is an issue, you can change the bind mount to a Docker volume instead as follows:

Make the following change to `.env`:

```diff
- DB_DATA_LOCATION=./postgres
+ DB_DATA_LOCATION=pgdata
```

Add the following line to the bottom of `docker-compose.yml`:

```diff
volumes:
  model-cache:
+ pgdata:
```

</details>

## Hardware

### OS

A Linux or \*nix 64-bit operating system (Ubuntu, Debian, etc.) is recommended.

Non-Linux operating systems tend to provide a poor Docker experience and are strongly discouraged. Our ability to assist with setup or troubleshooting on non-Linux operating systems will be severely reduced. If you still want to use one:

- Windows: [Docker Desktop on Windows](https://docs.docker.com/desktop/install/windows-install/) or [WSL 2](https://docs.docker.com/desktop/wsl/).
- macOS: [Docker Desktop on Mac](https://docs.docker.com/desktop/install/mac-install/).

Immich runs well in a virtualized environment when running in a full virtual machine. The use of Docker in LXC containers is [not recommended](https://pve.proxmox.com/wiki/Linux_Container), but may be possible for advanced users. If you have issues, we recommend that you switch to a supported VM deployment.

Windows users should also review [special requirements for Windows users](#special-requirements-for-windows-users).

### RAM

Minimum 6GB, recommended 8GB.

For a smooth experience, especially during asset upload, Immich requires at least 6GB of RAM. For systems with only 4GB of RAM, Immich can be run with machine learning features disabled.

If Docker resource limits are used, the Postgres database requires at least 2GB of RAM on its own.

### CPU

Minimum 2 cores, recommended 4 cores.

Immich runs on the `amd64` and `arm64` platforms. Since `v3`, the machine learning container on `amd64` requires the `>= x86-64-v2` [microarchitecture level](https://en.wikipedia.org/wiki/X86-64#Microarchitecture_levels). Most CPUs released since ~2012 support this microarchitecture. If you are using a virtual machine, ensure you have selected a [supported microarchitecture](https://pve.proxmox.com/pve-docs/chapter-qm.html#_qemu_cpu_types).

If you are unable to support this instruction set, the last version to support `x86-64-v1` is `v2.7.5`. Note that this release is no longer supported, and you must run a matching `immich-server` version.

### Storage

A Unix-compatible filesystem (EXT4, ZFS, APFS, etc.) with support for user/group ownership and permissions is recommended.

The generation of thumbnails and transcoded video can increase the size of the photo library by 10-20% on average. See [Storage locations](/reference/storage-locations) for what Immich writes where.

Good performance and a stable connection to the Postgres database is critical to a smooth Immich experience. The Postgres database files are typically between 1-3 GB in size. For this reason, the Postgres database (`DB_DATA_LOCATION`) should ideally use local SSD storage, and never a network share of any kind.

## Database

Immich is known to work with Postgres versions `>= 14, < 20`.

VectorChord is known to work with pgvector versions `>= 0.7, < 0.9`.

The Immich server will check the VectorChord version on startup to ensure compatibility, and refuse to start if a compatible version is not found.
The current accepted range for VectorChord is `>= 0.3, < 2.0`.
