# Server Commands

The `immich-server` docker image comes preinstalled with an administrative CLI (`immich-admin`) that supports the following commands:

| Command                  | Description                                                   |
| ------------------------ | ------------------------------------------------------------- |
| `help`                   | Display help                                                  |
| `reset-admin-password`   | Reset the password for the admin user                         |
| `disable-password-login` | Disable password login                                        |
| `enable-password-login`  | Enable password login                                         |
| `enable-oauth-login`     | Enable OAuth login                                            |
| `disable-oauth-login`    | Disable OAuth login                                           |
| `list-users`             | List Immich users                                             |
| `version`                | Print Immich version                                          |
| `change-media-location`  | Change database file paths to align with a new media location |

## How to run a command

To run a command, [connect](/docs/guides/docker-help.md#attach-to-a-container) to the `immich_server` container and then execute the command via `immich-admin <command>`.

## Examples

Reset Admin Password

```
immich-admin reset-admin-password
Found Admin:
- ID=e65e6f88-2a30-4dbe-8dd9-1885f4889b53
- OAuth ID=
- Email=admin@example.com
- Name=Immich Admin
? Please choose a new password (optional) immich-is-cool
The admin password has been updated.
```

Disable Password Login

```
immich-admin disable-password-login
Password login has been disabled.
```

Enable Password Login

```
immich-admin enable-password-login
Password login has been enabled.
```

Enable OAuth login

```
immich-admin enable-oauth-login
OAuth login has been enabled.
```

Disable OAuth login

```
immich-admin disable-oauth-login
OAuth login has been disabled.
```

List Users

```
immich-admin list-users
[
  {
    id: 'e65e6f88-2a30-4dbe-8dd9-1885f4889b53',
    email: 'immich@example.com.com',
    name: 'Immich Admin',
    storageLabel: 'admin',
    externalPath: null,
    profileImagePath: 'upload/profile/e65e6f88-2a30-4dbe-8dd9-1885f4889b53/e65e6f88-2a30-4dbe-8dd9-1885f4889b53.jpg',
    shouldChangePassword: true,
    isAdmin: true,
    createdAt: 2023-07-11T20:12:20.602Z,
    deletedAt: null,
    updatedAt: 2023-09-21T15:42:28.129Z,
    oauthId: '',
  }
]
```

Print Immich Version

```
immich-admin version
v1.129.0
```

Change media location

```
immich-admin change-media-location
? Enter the previous value of IMMICH_MEDIA_LOCATION: /usr/src/app/upload
? Enter the new value of IMMICH_MEDIA_LOCATION: /data

  Previous value: /usr/src/app/upload
  Current value:  /data

  Changing database paths from "/usr/src/app/upload/*" to "/data/*"

? Do you want to proceed? [Y/n] y

Database file paths updated successfully! 🎉

You may now set IMMICH_MEDIA_LOCATION=/data and restart!

(please remember to update applicable volume mounts e.g. ${UPLOAD_LOCATION}:/data)
```
