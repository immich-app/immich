# Jobs

The `immich-server` responds to API requests for data and files for the web and mobile app. To do this quickly and reliably, it offloads most other work to `immich-microservices` in the form of _jobs_. Simply put, a job is a request to process data in the background. Jobs are picked up automatically by microservices containers.

When a new asset is uploaded it kicks off a series of jobs, which include metadata extraction, thumbnail generation, machine learning tasks, and storage template migration, if enabled. To view the status of a job navigate to the Administration -> Jobs page.

Additionally, some jobs run on a schedule, which is every night at midnight. This schedule, with the exception of [External Libraries](/docs/features/libraries) scanning, cannot be changed.

:::info
Storage Migration job can be run after changing the [Storage Template](/docs/administration/storage-template.mdx), in order to apply the change to the existing library.
:::

<img src={require('./img/admin-jobs.png').default} width="80%" title="Admin jobs" />
