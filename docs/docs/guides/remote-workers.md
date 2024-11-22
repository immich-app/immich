# Remote workers

To distribute machine learning tasks, see [this guide](/docs/guides/remote-machine-learning).

For non-machine learning tasks, such as thumbnail generation, the worker needs access to

- postgres
- redis
- upload location
- [external libraries](/docs/guides/external-library) if used.

Modify the docker-compose.yml on your immich server like this to allow access to postgres and redis.
Restart both services after this change.

:::danger
Be aware of the security implications of this change!
:::

```diff
services:
  redis:
    ...
+    ports:
+      - "${REDIS_PORT:-6379}:${REDIS_PORT:-6379}"  # resolves to "6379:6379" if REDIS_PORT is not set

  database:
    ...
+    ports:
+      - "${DB_PORT:-5432}:${DB_PORT:-5432}"  # resolves to "5432:5432" if DB_PORT is not set
```

Copy the .env file and the immich-server part of docker-compose.yml to your worker machine.
Set `DB_HOSTNAME` and `REDIS_HOSTNAME` to the IP or hostname of your server.
You will probably want to change the [config file](/docs/install/config-file/) to match the workload on your worker.

Mount the upload location and [external libraries](/docs/guides/external-library) on your worker.
One way to mount your upload location would be to use [sshfs](https://github.com/libfuse/sshfs).

```shell
sshfs -o allow_root SERVER:/PATH/TO/UPLOAD_LOCATION /LOCAL/UPLOAD_LOCATION # allow_root is needed for docker to mount this.
```

```diff
services:
  immich-server:
  ...
    volumes:
      - ${UPLOAD_LOCATION}:/usr/src/app/upload  # UPLOAD_LOCATION must point to the server's UPLOAD_LOCATION!
  ...
+    environment:
+      IMMICH_WORKERS_EXCLUDE: 'api'
+      DB_HOSTNAME: # ip or hostname of your server
+      REDIS_HOSTNAME: # ip or hostname of your server
+      IMMICH_CONFIG_FILE:
```
# Remote workers

To distribute machine learning tasks, see [this guide](/docs/guides/remote-machine-learning).

For non-machine learning tasks, such as thumbnail generation, the worker needs access to

- postgres
- redis
- upload location
- [external libraries](/docs/guides/external-library) if used.

Modify the docker-compose.yml on your immich server like this to allow access to postgres and redis.
Restart both services after this change.

:::danger
Be aware of the security implications of this change!
:::

```diff
services:
  redis:
    ...
+    ports:
+      - "${REDIS_PORT:-6379}:${REDIS_PORT:-6379}"  # resolves to "6379:6379" if REDIS_PORT is not set

  database:
    ...
+    ports:
+      - "${DB_PORT:-5432}:${DB_PORT:-5432}"  # resolves to "5432:5432" if DB_PORT is not set
```

Copy the .env file and the immich-server part of docker-compose.yml to your worker machine.
Set `DB_HOSTNAME` and `REDIS_HOSTNAME` to the IP or hostname of your server.
You will probably want to change the [config file](/docs/install/config-file/) to match the workload on your worker.

Mount the upload location and [external libraries](/docs/guides/external-library) on your worker.
One way to mount your upload location would be to use [sshfs](https://github.com/libfuse/sshfs).

```shell
sshfs -o allow_root SERVER:/PATH/TO/UPLOAD_LOCATION /LOCAL/UPLOAD_LOCATION # allow_root is needed for docker to mount this as well.
```

```diff
services:
  immich-server:
  ...
    volumes:
      - ${UPLOAD_LOCATION}:/usr/src/app/upload  # UPLOAD_LOCATION must point to the server's UPLOAD_LOCATION!
  ...
+    environment:
+      IMMICH_WORKERS_EXCLUDE: 'api'
+      DB_HOSTNAME: # ip or hostname of your server
+      REDIS_HOSTNAME: # ip or hostname of your server
+      IMMICH_CONFIG_FILE:
```

## Sources

- https://github.com/immich-app/immich/discussions/6989#discussioncomment-10668319
- https://www.reddit.com/r/immich/comments/1bmk2z5/comment/lna5o7m/
