# Database GUI

A short guide on connecting [pgAdmin](https://www.pgadmin.org/) to Immich.

:::note

In order to connect to the database the immich_postgres container **must be running**.

The passwords and usernames used below match the ones specified in the example `.env` file. If changed, please use actual values instead.

**Optional:** To connect to the database **outside** of your Docker's network:

- Expose port 5432 in your `docker-compose.yml` file.
- Edit the PostgreSQL [`pg_hba.conf`](https://www.postgresql.org/docs/current/auth-pg-hba-conf.html) file.
- Make sure your firewall does not block access to port 5432.
  Note that exposing the database port increases the risk of getting attacked by hackers.  
  Make sure to remove the binding port after finishing the database's tasks.

:::

## 1. Install pgAdmin

Download and install [pgAdmin](https://www.pgadmin.org/download/) following the official documentation.

## 2. Add a Server

Open pgAdmin and click "Add New Server".

<img src={require('./img/add-new-server-option.png').default} width="50%" title="new server option" />

## 3. Enter Connection Details

| Name                 | Value       |
| -------------------- | ----------- |
| Host name/address    | `localhost` |
| Port                 | `5432`      |
| Maintenance database | `immich`    |
| Username             | `postgres`  |
| Password             | `postgres`  |

<img src={require('./img/Connection-Pgadmin.png').default} width="75%" title="Connection" />

## 4. Save Connection

Click on "Save" to connect to the Immich database.

:::tip
View [Database Queries](/docs/guides/database-queries/) for common database queries.
:::
