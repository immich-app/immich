# Server Commands

The `immich-server` docker image comes preinstalled with an administrative CLI (`immich-admin`) that supports the commands below.

To run one, see [Run a server command](/administration/run-a-server-command), which includes example output for each command.

## `help`

Display the list of available commands.

## `reset-admin-password`

Reset the password for the admin user, optionally invalidating existing sessions at the same time. This is the recovery path when nobody can log in as admin; the equivalent for other users is [Password Reset](/administration/manage-users#password-reset).

## `disable-password-login`

Disable password login for the entire instance, the same as turning it off under [Password Authentication](/reference/system-settings#password-authentication).

## `enable-password-login`

Enable password login, the same as turning it on under [Password Authentication](/reference/system-settings#password-authentication). This is how to recover when password login was disabled while OAuth was also unavailable, which otherwise leaves nobody able to log in.

## `disable-maintenance-mode`

Take the instance out of [maintenance mode](/administration/use-maintenance-mode).

## `enable-maintenance-mode`

Put the instance into [maintenance mode](/administration/use-maintenance-mode) and print a URL for logging in to it. Running it again issues a new URL, which is how to regain access if you are logged out while maintenance mode is active.

## `enable-oauth-login`

Enable OAuth login, the same as turning it on under [OAuth Authentication](/reference/system-settings#oauth-authentication). See [Set up OAuth authentication](/administration/set-up-oauth-authentication) for configuring a provider and [OAuth settings](/reference/oauth-settings) for every available option.

## `disable-oauth-login`

Disable OAuth login, the same as turning it off under [OAuth Authentication](/reference/system-settings#oauth-authentication).

## `list-users`

Print every user on the instance, including id, email, storage label, and admin status. See [Manage users](/administration/manage-users).

## `grant-admin`

Grant admin privileges to a user, selected by email. See [Manage users](/administration/manage-users).

## `revoke-admin`

Revoke admin privileges from a user, selected by email. See [Manage users](/administration/manage-users).

## `version`

Print the running Immich version. See [Versioning](/concepts/versioning) for what the version number implies about compatibility and upgrades.

## `change-media-location`

Rewrite the file paths stored in the database to match a new value of `IMMICH_MEDIA_LOCATION`. Run this after moving media to a new location — the command updates the database, it does not move any files. See [Storage locations](/reference/storage-locations).

## `schema-check`

Verify that database migrations are up to date and check for schema drift. See [Schema drift](/errors#schema-drift) for what to do when drift is reported.
