---
sidebar_position: 20
---

# Install Script [Experimental]

:::caution
This method is experimental and not currently recommended for production use. For production, please refer to installing with [Docker Compose](/docs/install/docker-compose.mdx).
:::

:::note
The install script only supports Linux operating systems and requires Docker to be already installed on the system.
:::

In the shell, from a directory of your choice, run the following command:

```bash
curl -o- https://raw.githubusercontent.com/immich-app/immich/main/install.sh | bash
```

The script will perform the following actions:

1. Download [docker-compose.yml](https://github.com/immich-app/immich/releases/latest/download/docker-compose.yml), and the [.env](https://github.com/immich-app/immich/releases/latest/download/example.env) file from the main branch of the [repository](https://github.com/immich-app/immich).
2. Start the containers.

The web application will be available at `http://<machine-ip-address>:2283`, and the server URL for the mobile app will be `http://<machine-ip-address>:2283/api`

The directory which is used to store the library files is `./immich-app` relative to the current directory.

:::tip
For common next steps, see [Post Install Steps](/docs/install/post-install.mdx).
:::
