---
sidebar_position: 5
---

# Server Commands

The `immich-server` docker image comes preinstalled with an administrative CLI that supports the following commands:

| Command                       | Description                           |
| ----------------------------- | ------------------------------------- |
| `immich help`                 | Display help                          |
| `immich reset-admin-password` | Reset the password for the admin user |

## How to run a command

To run a command, connect to the container and then execute it. For example:

```bash
docker exec -it immich-server_1 sh

/usr/src/app$ immich reset-admin-password
? Please choose a new password (optional) immich-is-awesome-unline-this-password
New password:
immich-is-awesome-unline-this-password
```
