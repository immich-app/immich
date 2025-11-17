# Maintenance Mode

Maintenance mode is used to perform administrative tasks such as restoring backups to Immich.

You can enter maintenance mode by either:

- Selecting "enable maintenance mode" in system settings in administration.
- Running the enable maintenance mode [administration command](./server-commands.md).

## Logging in during maintenance

Maintenance mode uses a separate login system which is handled automatically behind the scenes in most cases. Enabling maintenance mode in settings will automatically log you into maintenance mode when the server comes back up.

If you find that you've been logged out, you can:

- Open the logs for the Immich server and look for _"🚧 Immich is in maintenance mode, you can log in using the following URL:"_
- Run the enable maintenance mode [administration command](./server-commands.md) again, this will give you a new URL to login with.
- Run the disable maintenance mode [administration command](./server-commands.md) then re-enter through system settings.
