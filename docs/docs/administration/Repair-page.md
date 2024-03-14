# Repair Page

The repair page is designed to give information to the system administrator about files that are not tracked, or offline paths.

## Natural State

In this situation, everything is in its place and there is no problem that the system administrator should be aware of.

<img src={require('./img/Repair-page.png').default} title="server statistic" />

## Any Other Situation

:::note ram usge
Several users report a situation where the page fails to load, in order to solve this problem you should try to allocate more RAM for Immich, if the problem continues, you should stop using the reverse proxy while loading the page.
:::

Any other state describes the following 3 states:

- MATCHES - These files are matched by their checksums.

- OFFLINE PATHS - These files are the results of manual deletion of the default upload library.

:::tip
To get rid of Offline paths you can follow this [guide](/docs/guides/remove-offline-paths.md)
:::

- UNTRACKS FILES - These files are not tracked by the application. They can be the results of failed moves, interrupted uploads, or left behind due to a bug.

In addition, you can download the information from a page, mark everything (in order to check hashing) and correct the problem if a match is found in the hashing.

<img src={require('./img/Repair-page-1.png').default} title="server statistic" />
