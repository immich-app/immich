---
sidebar_position: 6
---

# FAQ

### What is the difference between the cloud icon on the mobile app?

| Icon                               | Description                                                                                                                                     |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| ![cloud](/img/cloud.svg)           | Asset is only available in the cloud and was uploaded from some other device (like the web client) or was deleted from this device after upload |
| ![cloud-cross](/img/cloud-off.svg) | Asset is only available locally and has not yet been backed up                                                                                  |
| ![cloud-done](/img/cloud-done.svg) | Asset was uploaded from this device and is now backed up in the cloud/server and still available in original on the device                      |

### How can I sync an existing directory with Immich's server?

Immich doesn't have the mechanism to sync an existing directory with the server. There is however, a helper CLI tool to help you bulk upload the existing photos and videos to the server. You can find the guide to use the CLI tool [here](/docs/usage/bulk-upload.md).

### Why doesn't Immich watch an existing photo gallery directory?

The initial approach of Immich is to become a backup tool, primarily for mobile device usage. Thus, all the assets must be uploaded from the mobile client. The app was architectured to perform that job well.

### How can I reset the admin password?

The admin password can be reset by running the [reset-admin-password](/docs/usage/server-commands) command on the immich-server.
