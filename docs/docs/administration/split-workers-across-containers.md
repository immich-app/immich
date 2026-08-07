# Split workers across containers

The `immich-server` container runs several [workers](/reference/workers) at once. If you prefer to throttle or distribute them, you can do this using the [environment variables](/reference/environment-variables) to specify which container should pick up which tasks.

For example, for a simple setup with one container for the Web/API and one for all other microservices, you can do the following:

Copy the entire `immich-server` block as a new service and make the following changes to the **copy**:

```diff
- immich-server:
-   container_name: immich_server
...
-   ports:
-     - 2283:2283
+ immich-microservices:
+   container_name: immich_microservices
```

Once you have two copies of the immich-server service, make the following changes to each one. This will allow one container to only serve the web UI and API, and the other one to handle all other tasks.

```diff
services:
  immich-server:
    ...
+   environment:
+     IMMICH_WORKERS_INCLUDE: 'api'

  immich-microservices:
    ...
+   environment:
+     IMMICH_WORKERS_EXCLUDE: 'api'
```
