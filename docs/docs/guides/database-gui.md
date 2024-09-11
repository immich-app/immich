# Database GUI

A short guide on connecting [pgAdmin](https://www.pgadmin.org/) to Immich.

## 1. Install pgAdmin

Add a file `docker-compose-pgadmin.yml` next to your `docker-compose.yml` with the following content:

```
name: immich

services:
  pgadmin:
    image: dpage/pgadmin4
    container_name: pgadmin4_container
    restart: always
    ports:
      - "8888:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: user-name@domain-name.com
      PGADMIN_DEFAULT_PASSWORD: strong-password
    volumes:
      - pgadmin-data:/var/lib/pgadmin

volumes:
  pgadmin-data:
```

Change the values of `PGADMIN_DEFAULT_EMAIL` and `PGADMIN_DEFAULT_PASSWORD` in this file.

Run `docker compose -f docker-compose.yml -f docker-compose-pgadmin.yml up` to start immich along with `pgAdmin`.

## 2. Add a Server

Open [localhost:8888](http://localhost:8888) and login with the default credentials from above.

Right click on `Servers` and click on `Register >> Server..` then enter the values below in the `Connection` tab.

<img src={require('./img/pgadmin-add-new-server.png').default} width="50%" title="new server option" />

:::note
The parameters used here match those specified in the example `.env` file. If you have changed your `.env` file, you'll need to adjust accordingly.
:::

| Name                 | Value             |
| -------------------- | ----------------- |
| Host name/address    | `immich_postgres` |
| Port                 | `5432`            |
| Maintenance database | `immich`          |
| Username             | `postgres`        |
| Password             | `postgres`        |

Click on "Save" to connect to the Immich database.
