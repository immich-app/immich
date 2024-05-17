# Jobs and Workers

The `immich-server` container contains multiple workers:

- `api`: responds to API requests for data and files for the web and mobile app.
- `microservices`: handles most other work, such as thumbnail generation and video encoding, in the form of _jobs_. Simply put, a job is a request to process data in the background.

When a new asset is uploaded it kicks off a series of jobs, which include metadata extraction, thumbnail generation, machine learning tasks, and storage template migration, if enabled. To view the status of a job navigate to the Administration -> Jobs page.

Additionally, some jobs run on a schedule, which is every night at midnight. This schedule, with the exception of [External Libraries](/docs/features/libraries) scanning, cannot be changed.

:::info
Storage Migration job can be run after changing the [Storage Template](/docs/administration/storage-template.mdx), in order to apply the change to the existing library.
:::

## Split workers

If you prefer to throttle or distribute the workers, you can do this using the [environment variables](/docs/install/environment-variables) to specify which container should pick up which tasks.

For example, you can run one container with `IMMICH_WORKERS_INCLUDE=api` to run the web UI, and another one with `IMMICH_WORKERS_EXCLUDE=api` to run all other workers.

<img src={require('./img/admin-jobs.png').default} width="80%" title="Admin jobs" />
