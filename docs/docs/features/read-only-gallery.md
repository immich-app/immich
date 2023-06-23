# Read-only Gallery [EXPERIMENTAL]


This feature enables the user to use the existing gallery without uploading the assets to Immich.

Upon syncing the file information, it will be read by Immich to generate supported files.

::: warning
This is a very primitive implementation of the read-only mechanism, enhancement of this feature will be continue developed in the future.

The current limitation of this feature are:

- Manually sync using the CLI tool, auto-sync (watch) is not supported.
- Only new files that added to the gallery will be detected. 
- Deletion and moving of files will not be detected.

:::

## Usage

::: tip

Assuming my gallery is stored at `/mnt/media/precious-memory`. 

We will use this value in the steps below.

:::

1. Mount the gallery to the containers.
2. Register the path for the user.
3. Sync with the CLI tool.

