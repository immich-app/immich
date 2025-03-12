---
sidebar_position: 60
---

# Unraid

Immich can easily be installed and updated on Unraid via:

1. [Docker Compose Manager](https://forums.unraid.net/topic/114415-plugin-docker-compose-manager/) plugin from the Unraid Community Apps
2. Community made template on the Unraid Community Apps

## Community Applications Template

:::info

- The Unraid template uses a community made image and is not officially supported by Immich

:::

In order to install Immich from the Unraid CA, you will need an existing Redis and PostgreSQL 14 container, If you do not already have Redis or PostgreSQL you can install them from the Unraid CA, just make sure you choose PostgreSQL **14**.

Once you have Redis and PostgreSQL running, search for Immich on the Unraid CA, choose either of the templates listed and fill out the example variables.

For more information about setting up the community image see [here](https://github.com/imagegenius/docker-immich#application-setup)

## Docker-Compose Method (Official)

:::info

- Guide was written using Unraid v6.12.10.
- Requires you to have installed the plugin: [Docker Compose Manager](https://forums.unraid.net/topic/114415-plugin-docker-compose-manager/)
- An Unraid share created for your images
- There has been a [report](https://forums.unraid.net/topic/130006-errortraps-traps-node27707-trap-invalid-opcode-ip14fcfc8d03c0-sp7fff32889dd8-more/#comment-1189395) of this not working if your Unraid server doesn't support AVX _(e.g. using a T610)_

:::

## Installation Steps

1. Go to "**Plugins**" and click on "**Compose.Manager**"
2. Click "**Add New Stack**" and when prompted for a label enter "**Immich**"

<img
src={require('./img/unraid01.webp').default}
width="70%"
alt="Select Plugins > Compose.Manager > Add New Stack > Label it Immich"
/>

3.  Select the cogwheel ⚙️ next to Immich and click "**Edit Stack**"
4.  Click "**Compose File**" and then paste the entire contents of the [Immich Docker Compose](https://github.com/immich-app/immich/releases/latest/download/docker-compose.yml) file into the Unraid editor. Remove any text that may be in the text area by default. Note that Unraid v6.12.10 uses version 24.0.9 of the Docker Engine, which does not support healthcheck `start_interval` as defined in the `database` service of the Docker compose file (version 25 or higher is needed). This parameter defines an initial waiting period before starting health checks, to give the container time to start up. Commenting out the `start_interval` and `start_period` parameters will allow the containers to start up normally. The only downside to this is that the database container will not receive an initial health check until `interval` time has passed.

    <details >
        <summary>Using an existing Postgres container? Click me! Otherwise proceed to step 5.</summary>
        <ul>
            <li>Comment out the database service</li>
            <img
                src={require('./img/unraid02.webp').default}
                width="50%"
                alt="Comment out database service in the compose file"
            />
            <li>Comment out the database dependency for <b>each service</b> <i>(example in screenshot below only shows 2 of the services - ensure you do this for all services)</i></li>
            <img
                src={require('./img/unraid03.webp').default}
                width="50%"
                alt="Comment out every reference to the database service in the compose file"
            />
            <li>Comment out the volumes</li>
            <img
                src={require('./img/unraid04.webp').default}
                width="20%"
                alt="Comment out database volume"
            />
        </ul>
    </details>

5.  Click "**Save Changes**", you will be prompted to edit stack UI labels, just leave this blank and click "**Ok**"
6.  Select the cog ⚙️ next to Immich, click "**Edit Stack**", then click "**Env File**"
7.  Paste the entire contents of the [Immich example.env](https://github.com/immich-app/immich/releases/latest/download/example.env) file into the Unraid editor, then **before saving** edit the following:

    - `UPLOAD_LOCATION`: Create a folder in your Images Unraid share and place the **absolute** location here > For example my _"images"_ share has a folder within it called _"immich"_. If I browse to this directory in the terminal and type `pwd` the output is `/mnt/user/images/immich`. This is the exact value I need to enter as my `UPLOAD_LOCATION`
    - `DB_DATA_LOCATION`: Change this to use an Unraid share (preferably a cache pool, e.g. `/mnt/user/appdata/postgresql/data`). This uses the `appdata` share. Do also create the `postgresql` folder, by running `mkdir /mnt/user/{share_location}/postgresql/data`. If left at default it will try to use Unraid's `/boot/config/plugins/compose.manager/projects/[stack_name]/postgres` folder which it doesn't have permissions to, resulting in this container continuously restarting.

      <img
      src={require('./img/unraid05.webp').default}
      width="70%"
      alt="Absolute location of where you want immich images stored"
      />

    <details >
        <summary>Using an existing Postgres container? Click me! Otherwise proceed to step 8.</summary>
        <p>Update the following database variables as relevant to your Postgres container:</p>
        <ul>
            <li><code>DB_HOSTNAME</code></li>
            <li><code>DB_USERNAME</code></li>
            <li><code>DB_PASSWORD</code></li>
            <li><code>DB_DATABASE_NAME</code></li>
            <li><code>DB_PORT</code></li>
        </ul>
    </details>

8.  Click "**Save Changes**" followed by "**Compose Up**" and Unraid will begin to create the Immich containers in a popup window. Once complete you will see a message on the popup window stating _"Connection Closed"_. Click "**Done**" and go to the Unraid "**Docker**" page

    > Note: This can take several minutes depending on your Internet speed and Unraid hardware

9.  Once on the Docker page you will see several Immich containers, one of them will be labelled `immich_server` and will have a port mapping. Visit the `IP:PORT` displayed in your web browser and you should see the Immich admin setup page.

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
For more information on how to use the application once installed, please refer to the [Post Install](/docs/install/post-install.mdx) guide.
:::

## Updating Steps

Updating is extremely easy however it's important to be aware that containers managed via the Docker Compose Manager plugin do not integrate with Unraid's native dockerman UI, the label "_update ready_" will always be present on containers installed via the Docker Compose Manager.

<img
src={require('./img/unraid09.webp').default}
width="50%"
alt="Docker Compose containers always say update ready, ignore it"
/>

You should ignore the "_update ready_" on the Unraid WebUI and update when you receive the notification within the Immich WebUI.
<img
src={require('./img/unraid10.webp').default}
width="50%"
alt="Immich update notification"
/>

1. Go to the "**Docker**" tab and scroll to the Compose section
2. Next to Immich click the "**Update Stack**" button and Unraid will begin to update all Immich related containers
   > Note: **Do not** select Compose Down first, it is unnecessary.
3. Once complete you will see a "_Connection Closed_" message, select "**Done**".
   <img
   src={require('./img/unraid11.webp').default}
   width="50%"
   alt="Wait for Connection Closed and click Done"
   />
4. Return back to the Immich WebUI and you will see the version has been updated to the latest
   <img
   src={require('./img/unraid12.webp').default}
   width="70%"
   alt="Wait for Connection Closed and click Done"
   />
