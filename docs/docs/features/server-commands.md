# Server Commands

The `immich-server` docker image comes preinstalled with an administrative CLI (`immich`) that supports the following commands:

| Command                  | Description                           |
| ------------------------ | ------------------------------------- |
| `help`                   | Display help                          |
| `reset-admin-password`   | Reset the password for the admin user |
| `disable-password-login` | Disable password login                |
| `enable-password-login`  | Enable password login                 |

## How to run a command

To run a command, connect to the container and then execute it by running `immich <command>`.

## Examples

```bash title="Reset Admin Password"
docker exec -it immich_server sh

/usr/src/app$ immich reset-admin-password
? Please choose a new password (optional) immich-is-awesome-unlike-this-password
New password:
immich-is-awesome-unlike-this-password
```

```bash title="Disable Password Login"
docker exec -it immich_server sh

/usr/src/app$ immich disable-password-login
Password login has been disabled.
```

```bash title="Enable Password Login"
docker exec -it immich_server sh

/usr/src/app$ immich enable-password-login
Password login has been enabled.
```
