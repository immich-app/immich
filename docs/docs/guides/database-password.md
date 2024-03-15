# Change Database Password

Since the database password is determined for the first time by the `.env` file with the initial activation of Immich, in order to change the database password it is necessary to connect to the database and change the password and then update it in the `.env` file.

This guide will show how you can change the database password.

:::danger backup your database
Before following the tutorial, make sure you have a [backup of your database](/docs/administration/backup-and-restore).
:::

To change the database password we will use the command;

`docker exec -it immich_postgres psql immich <DB_USERNAME>` to connect to the database via the container directly.

(Replace `<DB_USERNAME>` with the value from your [`.env` file](/docs/install/environment-variables#database)).

After connecting to the database we will change the password with the command

```sql title="Change password"
ALTER USER user_name WITH PASSWORD 'new_password';
```

:::info Password problems
Using the $ character in the password may cause problems, so you should avoid using it.
:::

### Verify the password change in the `.env` file accordingly

```diff title=".env"
# You can find documentation for all the supported env variables at https://immich.app/docs/install/environment-variables

# The location where your uploaded files are stored
UPLOAD_LOCATION=./library

# The Immich version to use. You can pin this to a specific version like "v1.71.0"
IMMICH_VERSION=release

# Connection secret for postgres. You should change it to a random password
- DB_PASSWORD=123
+ DB_PASSWORD=new_password
...
```

## Restart Immich.

```
docker compose down
docker compose up -d
```
