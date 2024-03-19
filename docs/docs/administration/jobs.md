# Jobs

Several Immich functionalities are implemented as jobs, which run in the background, Whenever an asset is uploaded to the server, the jobs will automatically start running in order until completion. To view the status of a job navigate to the Administration -> `Jobs` page.

All jobs run every night at midnight (cannot be changed) except for the external library job which can be [adjusted separately](/docs/features/libraries#set-custom-scan-interval).

:::info
Storage Migration job can be run after changing the [Storage Template](/docs/administration/storage-template.mdx), in order to apply the change to the existing library.
:::

<img src={require('./img/admin-jobs.png').default} width="80%" title="Admin jobs" />
