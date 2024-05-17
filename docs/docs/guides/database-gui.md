# Database GUI

A short guide on connecting [pgAdmin](https://www.pgadmin.org/) to Immich.

:::note
The passwords and usernames used below match the ones specified in the example `.env` file. If changed, please use actual values instead.
:::

## 1. Install pgAdmin

Add `pgadmin` as service to your `docker-compose.yml`

```
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

## 2. Add a Server

Open [localhost:8888](http://localhost:8888) and login with the credentials `PGADMIN_DEFAULT_EMAIL` and `PGADMIN_DEFAULT_PASSWORD` from above.

Right click on `Servers`, click on `Register >> Server..` and enter the following values in the `Connection` tab:


| Name                 | Value             |
| -------------------- | ----------------- |
| Host name/address    | `immich_postgres` |
| Port                 | `5432`            |
| Maintenance database | `immich`          |
| Username             | `postgres`        |
| Password             | `postgres`        |

Click on "Save" to connect to the Immich database.

<img src={require('./img/pgadmin-add-new-server.png').default} width="50%" title="new server option" />
