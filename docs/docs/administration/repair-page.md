# Repair Page

The repair page is designed to give information to the system administrator about files that are not tracked, or offline paths.

## Natural State

In this situation, everything is in its place and there is no problem that the system administrator should be aware of.

<img src={require('./img/repair-page.png').default} title="server statistic" />

## Any Other Situation

:::note RAM Usage
Several users report a situation where the page fails to load. In order to solve this problem you should try to allocate more RAM to Immich, if the problem continues, you should stop using the reverse proxy while loading the page.
:::

In any other situation, there are 3 different options that can appear:

- MATCHES - These files are matched by their checksums.

- OFFLINE PATHS - These files are the result of manually deleting files from immich or a failed file move in the past (losing track of a file).

- UNTRACKED FILES - These files are not tracked by the application. They can be the result of failed moves, interrupted uploads, or left behind due to a bug.

In addition, you can download the information from a page, mark everything (in order to check hashing) and correct the problem if a match is found in the hashing.

<img src={require('./img/repair-page-1.png').default} title="server statistic" />
