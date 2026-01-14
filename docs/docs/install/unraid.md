---
sidebar_position: 60
---

# Unraid

Immich can easily be installed and updated on Unraid via either:

1. [Docker Compose Manager](https://forums.unraid.net/topic/114415-plugin-docker-compose-manager/) (plugin from the Unraid Community Apps) (recommended).
2. Community-maintained templates from the [Community Applications](https://forums.unraid.net/topic/38582-plug-in-community-applications/) (not recommended).

## Docker Compose (recommended)

:::info

- This guide was written using Unraid v7.1.4.
- Requires you to have installed the [Docker Compose Manager](https://forums.unraid.net/topic/114415-plugin-docker-compose-manager/) plugin.
- An Unraid share for your images.

_Note: There has been a [report](https://forums.unraid.net/topic/130006-errortraps-traps-node27707-trap-invalid-opcode-ip14fcfc8d03c0-sp7fff32889dd8-more/#comment-1189395) of this not working if your Unraid server doesn't support AVX (e.g. using a T610)_

:::

### Installation Steps

1. Go to "**Plugins**" and click on the icon to the left of "**Compose Manager**".
2. Click "**Add New Stack**".
3. Enter "**Immich**" as the stack name.
4. Click OK.

<img
src={require('./img/unraid01.webp').default}
width="70%"
alt="Select Plugins > Compose.Manager > Add New Stack > Label it Immich"
/>

5.  Click the cogwheel ⚙️ → "**Edit Stack**".
6.  Click "**Compose File**". Remove any text that may be in the editor by default. **Paste** the entire contents of the [Immich Docker Compose](https://github.com/immich-app/immich/releases/latest/download/docker-compose.yml) file into the editor. Click "**Save Changes**".
7.  You will be prompted to edit stack UI labels. You don't have to. Just leave this blank and click "**Ok**".
8.  Select the cog ⚙️ next to Immich again and click "**Edit Stack**", then click "**Env File**".
9.  Paste the entire contents of [example.env](https://github.com/immich-app/immich/releases/latest/download/example.env) into the Unraid editor, then **before saving** edit the following:
    - `UPLOAD_LOCATION`: Absolute path to where you want to store the immich assets. For example `/mnt/user/immich` (if the share is called immich) or `/mnt/user/images/immich` (if you have a share called "images" with a folder called "immich" inside it). Note that Immich will populate this folder with data like backups, images, converted videos etc.
    - `DB_DATA_LOCATION`: Absolute path to the PostgreSQL data folder. For example `/mnt/user/appdata/immich_postgresql/data`. You must create this folder if you don't already have it. If left at default it will try to use Unraid's `/boot/config/plugins/compose.manager/projects/[stack_name]/postgres` folder which it doesn't have permissions to, resulting in this container continuously restarting. Make sure the folder is on an SSD for optimal performance.
    - To set a timezone uncomment the `TZ=` line and change Etc/UTC to a TZ identifier from [this list](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones#List). For example `TZ=Europe/Copenhagen`.
    - Set a `DB_PASSWORD` for PostgreSQL.

    <details >
        <summary>Using an existing PostgreSQL container? Click me! Otherwise proceed.</summary>
        <p>Update the following database variables as relevant to your PostgreSQL container:</p>
        <ul>
            <li><code>DB_HOSTNAME</code></li>
            <li><code>DB_USERNAME</code></li>
            <li><code>DB_PASSWORD</code></li>
            <li><code>DB_DATABASE_NAME</code></li>
            <li><code>DB_PORT</code></li>
        </ul>
    </details>

10.  Click "**Save Changes**".
11.  Click "**Compose Up**" and wait for Unraid to create the containers. Once complete click "**Done**" and go to the Unraid "**Docker**" page.
12.  On the Docker page you should now see three new docker containers: `immich_redis`, `immich_machine_learning` and `immich_server`. To the right of `immich_server` you can see the assigned port mapping. Visit `UNRAID_IP:PORT` (for example `192.168.1.50:2283`) to go to the Immich admin setup page. You can change the port number in the docker-compose.yml file you added earlier.

<img
src={require('./img/unraid06.webp').default}
width="80%"
alt="Go to Docker Tab and visit the address listed next to immich-web"
/>

<details >
    <summary>Using the FolderView plugin for organizing your Docker containers? Click me! Otherwise you're complete!</summary>
    <p>If you are using the FolderView plugin go the Docker tab and select "<b>New Folder</b>".<br />Label it <i>"Immich"</i> and use this URL as the logo: https://raw.githubusercontent.com/immich-app/immich/main/design/immich-logo.png<br/>Then simply select all the Immich related containers before clicking "<b>Submit</b>"</p>
    <img
        src={require('./img/unraid07.webp').default}
        width="80%"
        alt="Go to Docker Tab and visit the address listed next to immich-web"
    />
    <img
        src={require('./img/unraid08.webp').default}
        width="90%"
        alt="Go to Docker Tab and visit the address listed next to immich-web"
    />
    
</details>

:::tip
For more information on how to use the application once installed, please refer to the [Post Install](/install/post-install.mdx) guide.
:::

### Hardware Transcoding and Hardware-Accelerated Machine Learning

In order to configure Immich for hardware transcoding and machine learning you need to edit the docker-compose.yml file accordingly, but since Unraid doesn't support multiple compose files you should pay attention to the "Single Compose File" section under [Hardware Transcoding](https://docs.immich.app/features/hardware-transcoding) and [Hardware-Accelerated Machine Learning](https://docs.immich.app/features/ml-hardware-acceleration). Apart from that there is nothing unique about Unraid. Just make sure you are using a version of Unraid with a kernel that supports your GPU.

## Updating

:::danger
Always follow the general [upgrade instructions](/install/upgrading.md) when upgrading.
:::

In Unraid, if you installed Immich using Docker Compose Manager you won't get notified about new versions in Unraid.

1. Go to the "**Docker**" tab and scroll to the Compose section at the bottom.
2. Next to Immich click the "**Update Stack**" button and Unraid will begin to update all Immich related containers. Note: **Do not** select Compose Down first, it is unnecessary.
3. Once complete you will see a "_Connection Closed_" message, select "**Done**".
   <img
   src={require('./img/unraid11.webp').default}
   width="50%"
   alt="Wait for Connection Closed and click Done"
   />
4. Return back to the Immich WebUI and you will see the version has been updated to the latest.
   <img
   src={require('./img/unraid12.webp').default}
   width="70%"
   alt="Wait for Connection Closed and click Done"
   />

## Community Applications Template (not recommended)

:::info

- The Unraid template uses a community made image that is not officially supported by Immich.

:::

In order to install Immich from the Unraid Community Applications, you will need an existing Redis and PostgreSQL 14 container, If you do not already have Redis or PostgreSQL you can install them from the Unraid Community Applications, just make sure you choose PostgreSQL **14**.

Once you have Redis and PostgreSQL running, search for Immich on the Unraid Community Applications, choose either of the templates listed and fill out the example variables.

For more information about setting up the community image see [here](https://github.com/imagegenius/docker-immich#application-setup)
