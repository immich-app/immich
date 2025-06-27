---
sidebar_position: 80
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# TrueNAS [Community]

:::note
This is a community contribution and not officially supported by the Immich team, but included here for convenience.

Community support can be found in the dedicated channel on the [Discord Server](https://discord.immich.app/).

**Please report app issues to the corresponding [Github Repository](https://github.com/truenas/apps/tree/master/trains/community/immich).**
:::

:::warning
This guide covers the installation of Immich on TrueNAS Community Edition 24.10.2.2 (Electric Eel) and later.

We recommend keeping TrueNAS Community Edition and Immich relatively up to date with the latest versions to avoid any issues.

If you are using an older version of TrueNAS, we ask that you upgrade to the latest version before installing Immich. Check the [TrueNAS Community Edition Release Notes](https://www.truenas.com/docs/softwarereleases/) for more information on breaking changes, new features, and how to upgrade your system.
:::

Immich can easily be installed on TrueNAS Community Edition via the **Community** train application.
Consider reviewing the TrueNAS [Apps resources](https://apps.truenas.com/getting-started/) if you have not previously configured applications on your system.

TrueNAS Community Edition makes installing and updating Immich easy, but you must use the Immich web portal and mobile app to configure accounts and access libraries.

## First Steps

Before installing the Immich app in TrueNAS, review the [Environment Variables](#environment-variables) documentation to see if you want to configure any during installation.
You may also configure environment variables at any time after deploying the application.

### Setting up Storage Datasets

<Tabs groupId="truenas-storage-tabs">
  <TabItem value="truenas-new-storage" label="New Storage Configuration (Default)" default>

    Before beginning app installation, [create the datasets](https://www.truenas.com/docs/scale/scaletutorials/storage/datasets/datasetsscale/) to use in the **Storage Configuration** section during installation.

    In TrueNAS, Immich requires 2 datasets for the application to function correctly: `data` and `pgData`. You can set the datasets to any names to match your naming conventions or preferences.
    You can organise these as one parent with two child datasets, for example `/mnt/tank/immich/data` and `/mnt/tank/immich/pgData`.

    <img
    src={require('./img/truenas12.webp').default}
    width="30%"
    alt="Immich App Widget"
    className="border rounded-xl"
    />

    :::info Datasets Permissions

    The **pgData** dataset must be owned by the user `netdata` (UID 999) for Postgres to start.

    The `data` dataset must have given the ***modify*** permission to the user who will run Immich.

    Since TrueNAS Community Edition 24.10.2.2 and later, Immich can be run as any user and group, the default user being `apps` (UID 568) and the default group being `apps` (GID 568). This user, either `apps` or another user you choose, must have ***modify*** permissions on the **data** dataset.

    For an easy setup:
      - Select `Dataset Preset` **Apps** instead of **Generic** when creating the `data` dataset. This will automatically give the correct permissions to the dataset. If you want to use another user for Immich, you can keep the **Generic** preset, but you will need to give the ***modify*** permission to that other user.
      - For the `pgData` dataset, you can keep the default preset **Generic** as permissions can be set during the installation of the Immich app (See [Storage Configuration](#storage-configuration) section).
    :::

    :::tip
    To improve performance, Immich recommends using SSDs for the database. If you have a pool made of SSDs, you can create the `pgData` dataset on that pool.

    Thumbnails can also be stored on the SSDs for faster access. This is an advanced option and not required for Immich to run. More information on how you can use multiple datasets to manage Immich storage in a finer-grained manner can be found in the [Advanced: Multiple Datasets for Immich Storage](#advanced-multiple-datasets-for-immich-storage) section below.
    :::

    :::warning
    If you just created the datasets using the **Apps** preset, you can skip this warning section.

    If the **data** dataset uses ACL it must have [ACL mode](https://www.truenas.com/docs/scale/scaletutorials/datasets/permissionsscale/) set to `Passthrough` if you plan on using a [storage template](/docs/administration/storage-template.mdx) and the dataset is configured for network sharing (its ACL type is set to `SMB/NFSv4`). When the template is applied and files need to be moved from **upload** to **library** (internal folder created by Immich within the **data** dataset), Immich performs `chmod` internally and must be allowed to execute the command. [More info.](https://github.com/immich-app/immich/pull/13017)

    To change or verify the ACL mode, go to the **Datasets** screen, select the **library** dataset, click on the **Edit** button next to **Dataset Details**, then click on the ** Advanced Options** tab, scroll down to the **ACL Mode** section, and select `Passthrough` from the dropdown menu. Click **Save** to apply the changes. If the option is greyed out, set the **ACL Type** to `SMB/NFSv4` first, then you can change the **ACL Mode** to `Passthrough`.
    :::

  </TabItem>

  <TabItem value="truenas-old-storage" label="Old Storage Configuration (Will be deprecated)">

    Before beginning app installation, [create the datasets](https://www.truenas.com/docs/scale/scaletutorials/storage/datasets/datasetsscale/) to use in the **Storage Configuration** section during installation.

    In TrueNAS, Immich requires 7 datasets: `library`, `upload`, `thumbs`, `profile`, `video`, `backups`, and `pgData`.
    You can organise these as one parent with seven child datasets, for example `/mnt/tank/immich/library`, `/mnt/tank/immich/upload`, and so on.

    <img
    src={require('./img/truenas12.webp').default}
    width="30%"
    alt="Immich App Widget"
    className="border rounded-xl"
    />

    :::info Datasets Permissions

    The **pgData** dataset must be owned by the user `netdata` (UID 999) for Postgres to start.

    The other datasets must have given the ***modify*** permission to the user who will run Immich.

    Since TrueNAS Community Edition 24.10.2.2 and later, Immich can be run as any user and group, the default user being `apps` (UID 568) and the default group being `apps` (GID 568). This user, either `apps` or another user you choose, must have ***modify*** permissions on the other datasets: `library`, `upload`, `thumbs`, `profile`, `video`, and `backups`.

    For an easy setup:
     - Select `Dataset Preset` **Apps** instead of **Generic** when creating the `library`, `upload`, `thumbs`, `profile`, `video`, and `backups` datasets. This will automatically apply permissions for the `apps` user.
     - For the `pgData` dataset, you can keep the default preset **Generic** as permissions can be set during the installation of the Immich app (See [Storage Configuration](#storage-configuration) section).
    :::

    :::tip
    To improve performance, Immich recommends using SSDs for the database. If you have a pool made of SSDs, you can create the `pgData` dataset on that pool.

    You can also create the **thumbs** dataset on this same pool to have faster access to the thumbnails (what will be displayed in the Immich web interface and mobile app). Note that the **thumbs** dataset takes more space than the **pgData** dataset, so make sure you have enough space on the SSD pool.
    :::

    :::warning
    If you just created the datasets using the **Apps** preset, you can skip this warning section.

    If the **library** dataset uses ACL it must have [ACL mode](https://www.truenas.com/docs/scale/scaletutorials/datasets/permissionsscale/) set to `Passthrough` if you plan on using a [storage template](/docs/administration/storage-template.mdx) and the dataset is configured for network sharing (its ACL type is set to `SMB/NFSv4`). When the template is applied and files need to be moved from **upload** to **library**, Immich performs `chmod` internally and must be allowed to execute the command. [More info.](https://github.com/immich-app/immich/pull/13017)

    To change or verify the ACL mode, go to the **Datasets** screen, select the **library** dataset, click on the **Edit** button next to **Dataset Details**, then click on the ** Advanced Options** tab, scroll down to the **ACL Mode** section, and select `Passthrough` from the dropdown menu. Click **Save** to apply the changes. If the option is greyed out, set the **ACL Type** to `SMB/NFSv4` first, then you can change the **ACL Mode** to `Passthrough`.
    :::

  </TabItem>
</Tabs>

:::note Old TrueNAS Versions Permissions
If you were using an older version of TrueNAS (before 24.10.2.2), the datasets, except the one for **pgData** had only to be owned by the `root` user (UID 0). You might have to add the **modify** permission to the `apps` user (UID 568) or the user you want to run Immich as, to all of them, except **pgData**. The steps to add or change ACL permissions are described in the [TrueNAS documentation](https://www.truenas.com/docs/scale/scaletutorials/datasets/permissionsscale/).
:::

## Installing the Immich Application

To install the **Immich** application, go to **Apps**, click **Discover Apps**, and either begin typing Immich into the search field or scroll down to locate the **Immich** application widget.

<div style={{ marginBottom: '2rem', border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>

Click on the widget to open the **Immich** application details screen.
<img
src={require('./img/truenas01.webp').default}
width="50%"
alt="Immich App Widget"
className="border rounded-xl"
/>

</div>

<div style={{ marginBottom: '2rem', border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>

Click **Install** to open the Immich application configuration screen.
<img
src={require('./img/truenas02.webp').default}
width="100%"
alt="Immich App Details Screen"
className="border rounded-xl"
/>

</div>

Application configuration settings are presented in several sections, each explained below.
To find specific fields, click in the **Search Input Fields** search field, scroll down to a particular section or click on the section heading on the navigation area in the upper-right corner.

### Application Name and Version

<img
src={require('./img/truenas03.webp').default}
width="100%"
alt="Install Immich Screen"
className="border rounded-xl mb-4"
/>

**_Application Name_**  
Keep the default value or enter a name in the **Application Name** field.  
Change it if you’re deploying a second instance.

**_Version_**  
Keep the default version number in **Version**.  
When a new version becomes available, an update badge appears, and the **Installed Applications** screen shows a button to update it.

### Immich Configuration

<img
src={require('./img/truenas05.webp').default}
width="40%"
alt="Configuration Settings"
className="border rounded-xl mb-4"
/>

The **Timezone** is set to the system default, which usually matches your local timezone. You can change it to another timezone if you prefer.
**Timezone** is only used by the Immich `exiftool` microservice if it cannot be determined from the image metadata.

**Enable Machine Learning** is enabled by default. It allows Immich to use machine learning features such as face recognition, image search, and smart duplicate detection. Untick this option if you do not want to use these features.

Select the **Machine Learning Image Type** based on the hardware you have.

- **Default**: Use this if you do not want to use hardware acceleration for machine learning or do not have a compatible GPU or a CPU with integrated graphics.
- **CUDA**: Use this if you have an NVIDIA GPU.
- **ROCm**: Use this if you have an AMD GPU or AMD CPU with integrated graphics.
- **OpenVINO**: Use this if you have an Intel GPU or Intel CPU with integrated graphics.

For more information on hardware acceleration, see [Hardware-Accelerated Machine Learning](/docs/features/ml-hardware-acceleration.md).

**Database Password** should be set to a custom value using only the characters `A-Za-z0-9`. This password is used to secure the Postgres database.

**Redis Password** should be set to a custom value using only the characters `A-Za-z0-9`. Preferably, use a different password from the database password.

Keep the **Log Level** to the default `Log` value.

Leave **Hugging Face Endpoint** blank. (This is used to download ML models from a different source.)

**Database Storage Type** set it to the type of storage (**HDD** or **SSD**) the pool, where the **pgData** dataset is located, uses.

**Additional Environment Variables** can be left blank.

<details>
<summary>Advanced users: Adding Environment Variables</summary>

Environment Variables can be set by clicking the **Add** button and filling in the **Name** and **Value** fields.

<img
src={require('./img/truenas11.webp').default}
width="40%"
alt="Environment Variables"
className="border rounded-xl"
/>

They are used to add custom configuration options or to enable specific features. As an example, if enough RAM can be reserved for Immich at all time on your system, and that machine learning is enabled, it is possible to add the environment variable: `MACHINE_LEARNING_PRELOAD__CLIP__TEXTUAL` to keep the CLIP model in memory for faster load on the first request.

More information on available environment variables can be found in the **[Environment Variables documentation](/docs/install/environment-variables/)**.

:::info
Some Environment Variables are not available for the TrueNAS Community Edition app as they can be configured through GUI options in the [Edit Immich screen](#edit-app-settings).

Some examples are: `IMMICH_VERSION`, `UPLOAD_LOCATION`, `DB_DATA_LOCATION`, `TZ`, `IMMICH_LOG_LEVEL`, `DB_PASSWORD`, `REDIS_PASSWORD`.
:::

</details>

### Network Configuration

<img
src={require('./img/truenas06.webp').default}
width="40%"
alt="Networking Settings"
className="border rounded-xl"
/>

- **Port Bind Mode**: This lets you expose the port to the host system, allowing you to access Immich from outside the TrueNAS system. Keep the default **_Publish port on the host for external access_** value unless you have a specific reason to change it.

- **Port Number**: Keep the default port `30041` or enter a custom port number.

- **Host IPs**: Leave the default blank value.

:::note Advanced Users
**Host IPs** feature can be used to bind one or multiple IP addresses of the TrueNAS system to an App. Lawrence Systems' tutorial on [How To Assign Per-App IPs in TrueNAS](https://www.youtube.com/watch?v=P6WrEp64qzg&) explains how to use this feature.
:::

### Storage Configuration

:::danger Default Settings (Not recommended)
The default setting for datasets is **ixVolume (dataset created automatically by the system)**. This is not recommended as this results in your data being harder to access manually and can result in data loss if you delete the immich app. It is also harder to manage snapshots and replication tasks. It is recommended to use the **Host Path (Path that already exists on the system)** option instead.
:::

<Tabs groupId="truenas-storage-tabs">
  <TabItem value="truenas-new-storage" label="New Storage Configuration (Default)" default>

    :::info
    **Postgres Data Storage** once **Host Path** is selected, a checkbox appears with ***Automatic Permissions***, if you have not set the ownership of the **pgData** dataset to `netdata` (UID 999), tick this box as it will set the user ownership to `netdata` (UID 999) and the group ownership to `docker` (GID 999) automatically. If you have set the ownership of the **pgData** dataset to `netdata` (UID 999), you can leave this box unticked.
    :::

  </TabItem>
  <TabItem value="truenas-old-storage" label="Old Storage Configuration (Will be deprecated)">
    Immich requires seven storage datasets.

    <img
    src={require('./img/truenas07.webp').default}
    width="20%"
    alt="Configure Storage ixVolumes"
    className="border rounded-xl"
    />

    For each Storage option, except for **Machine Learning Cache**, select **Host Path (Path that already exists on the system)** and then select the matching dataset [created before installing the app](#setting-up-storage-datasets): **Immich Library Storage**: `library`, **Immich Uploads Storage**: `upload`, **Immich Thumbs Storage**: `thumbs`, **Immich Profile Storage**: `profile`, **Immich Video Storage**: `video`, **Immich Backups Storage**: `backups`, **Postgres Data Storage**: `pgData`.

    **Machine Learning Cache** can be kept to the default value of `Temporary (Temporary directory created on the disk)`. It still has to be set, even if you have unticked the **Enable Machine Learning** option in the **Immich Configuration** section, it will not be used.

    :::info
    **Postgres Data Storage** once **Host Path** is selected, a checkbox appears with ***Automatic Permissions***, if you have not set the ownership of the **pgData** dataset to `netdata` (UID 999), tick this box as it will set the user ownership to `netdata` (UID 999) and the group ownership to `docker` (GID 999) automatically. If you have set the ownership of the **pgData** dataset to `netdata` (UID 999), you can leave this box unticked.
    :::

    <img
    src={require('./img/truenas08.webp').default}
    width="40%"
    alt="Configure Storage Host Paths"
    className="border rounded-xl"
    />
    The image above has example values.

    <br/>

  </TabItem>
</Tabs>

### Additional Storage (Advanced Users)

<details>
<summary>External Libraries</summary>

#### [External Libraries](/docs/features/libraries)

:::danger Advanced Users Only
This feature should only be used by advanced users. If this is your first time installing Immich, then DO NOT mount an external library until you have a working setup.
:::

<img
src={require('./img/truenas10.webp').default}
width="40%"
alt="Configure Storage Host Paths"
className="border rounded-xl"
/>

You may configure [External Libraries](/docs/features/libraries) by mounting them using **Additional Storage**.

- **Mount Path** is the location you will need to copy and paste into the External Library settings within Immich.
- **Host Path** is the location on the TrueNAS Community Edition server where your external library is located.
- **Read Only** is a checkbox that you can tick if you want to prevent Immich from modifying the files in the external library. This is useful if you want to use Immich to view and search your external library without modifying it.

:::warning
Each mount path MUST be something unique and should NOT be your library or upload location or a Linux directory like `/lib`.

A general recommendation is to mount any external libraries to a path beginning with `/mnt` or `/media` followed by a unique name, such as `/mnt/external-libraries` or `/media/my-external-libraries`. If you plan to mount multiple external libraries, you can use paths like `/mnt/external-libraries/library1`, `/mnt/external-libraries/library2`, etc.

:::

</details>

<details>
<summary>Multiple Datasets for Immich Storage</summary>

:::danger Advanced Users Only
This feature should only be used by advanced users.
:::

</details>

<!-- A section for Labels could be added, but I don't think it is needed as they are of no use for Immich. -->

### Resources Configuration

<img
src={require('./img/truenas09.webp').default}
width="40%"
alt="Resource Limits"
className="border rounded-xl"
/>

- **CPU**: Depending on your system resources, you can keep the default value of `2` threads or specify a different number. Increasing this value can improve performance, Immich recommends `4` cores. System with Multi-/Hyper-threading have 2 threads per core (TrueNAS Dashboard shows the number of threads, so you can use that to determine how many threads you have available).

- **Memory**: Limit in MB of RAM. Immich recommends at least 6000 MB (6GB). If you selected **Enable Machine Learning** in **Immich Configuration**, you should probably set this above 8000 MB.

Both **CPU** and **Memory** are limits, not reservations. This means that Immich can use up to the specified amount of CPU threads and RAM, but it will not reserve that amount of resources at all times. The system will allocate resources as needed, and Immich will use less than the specified amount most of the time.

- Enable **GPU Configuration** options if you have a GPU or CPU with integrated graphics that you will use for [Hardware Transcoding](/docs/features/hardware-transcoding) and/or [Hardware-Accelerated Machine Learning](/docs/features/ml-hardware-acceleration.md).

The process for NVIDIA GPU passthrough requires additional steps.
More info: [GPU Passthrough Docs for TrueNAS Apps](https://apps.truenas.com/managing-apps/installing-apps/#gpu-passthrough)

### Install

Finally, click **Install**.
The system opens the **Installed Applications** screen with the Immich app in the **Deploying** state.
When the installation completes, it changes to **Running**.

<img
src={require('./img/truenas04.webp').default}
width="100%"
alt="Immich Installed"
className="border rounded-xl"
/>

Click **Web Portal** on the **Application Info** widget, or go to the URL `http://<your-truenas-ip>:30041` in your web browser to open the Immich web interface. This will show you the onboarding process to set up your first user account, which will be an administrator account.

After that, you can start using Immich to upload and manage your photos and videos.

:::tip
For more information on how to use the application once installed, please refer to the [Post Install](/docs/install/post-install.mdx) guide.
:::

## Edit App Settings

- Go to the **Installed Applications** screen and select Immich from the list of installed applications.
- Click **Edit** on the **Application Info** widget to open the **Edit Immich** screen.
- Change any settings you would like to change.
  - The settings on the edit screen are the same as on the install screen.
- Click **Update** at the very bottom of the page to save changes.
  - TrueNAS automatically updates, recreates, and redeploys the Immich container with the updated settings.

## Updating the App

:::danger
Make sure to read the general [upgrade instructions](/docs/install/upgrading.md).
:::

When updates become available, TrueNAS alerts and provides easy updates.
To update the app to the latest version:

- Go to the **Installed Applications** screen and select Immich from the list of installed applications.
- Click **Update** on the **Application Info** widget from the **Installed Applications** screen.
- This opens an update window with some options
  - You may select an Image update too.
  - You may view the Changelog.
- Click **Upgrade** to begin the process and open a counter dialog that shows the upgrade progress.
  - When complete, the update badge and buttons disappear and the application Update state on the Installed screen changes from Update Available to Up to date.

## Migrating from Old Storage Configuration
