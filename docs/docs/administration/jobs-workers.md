# Jobs and Workers

## Workers

### Architecture

The `immich-server` container contains multiple workers:

- `api`: responds to API requests for data and files for the web and mobile app.
- `microservices`: handles most other work, such as thumbnail generation and video encoding, in the form of _jobs_. Simply put, a job is a request to process data in the background.

## Split workers

If you prefer to throttle or distribute the workers, you can do this using the [environment variables](/docs/install/environment-variables) to specify which container should pick up which tasks.

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

## Jobs

When a new asset is uploaded it kicks off a series of jobs, which include metadata extraction, thumbnail generation, machine learning tasks, and storage template migration, if enabled. To view the status of a job navigate to the Administration -> Jobs page.

Additionally, some jobs run on a schedule, which is every night at midnight. This schedule, with the exception of [External Libraries](/docs/features/libraries) scanning, cannot be changed.

:::info
Storage Migration job can be run after changing the [Storage Template](/docs/administration/storage-template.mdx), in order to apply the change to the existing library.
:::

<img src={require('./img/admin-jobs.webp').default} width="60%" title="Admin jobs" />
