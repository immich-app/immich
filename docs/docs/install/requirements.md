---
sidebar_position: 10
---

# Requirements

Hardware and software requirements for Immich:

## Software

Immich requires [**Docker**](https://docs.docker.com/get-started/get-docker/) with the **Docker Compose plugin**:

- **Docker Engine**: This CLI variant is suitable for Linux servers or Windows via WSL2.
- **Docker Desktop**: This GUI variant is suitable for Linux (desktop), Windows or macOS.

The Compose plugin will be installed by both Docker Engine and Desktop by following the linked installation guides; it can also be [separately installed](https://docs.docker.com/compose/install/) (pick the plugin, not the standalone).

:::note
Immich requires the command `docker compose` (the plugin); the similarly named `docker-compose` (the standalone) is [deprecated](https://docs.docker.com/compose/migrate/) and is no longer compatible with Immich.
:::

## Hardware

- **OS**: Linux is recommended, and Windows and macOS are supported: any version or distribution that Docker can be installed on (see above).
- **RAM**: Minimum 4GB, recommended 6GB.
- **CPU**: Minimum 2 cores, recommended 4 cores.
- **Storage**: Recommended Unix-compatible filesystem (EXT4, ZFS, APFS, etc.) with support for user/group ownership and permissions.
  - This can present an issue for Windows users. See below for details and an alternative setup.
  - The generation of thumbnails and transcoded video can increase the size of the photo library by 10-20% on average.
  - Network shares are supported for the storage of image and video assets only. It is not recommended to use a network share for your database location due to performance and possible data loss issues.

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
