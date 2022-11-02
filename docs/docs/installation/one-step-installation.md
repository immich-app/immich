---
sidebar_position: 2
---

# One-step installation

:::caution
This method is for evaluation purposes only. It is not recommended for production use. For production usage, please refer to the recommneded installation method [here](/docs/installation/recommended-installation).
:::

In the shell, from the directory of your choice, run the following command:

```bash
curl -o- https://raw.githubusercontent.com/immich-app/immich/main/install.sh | bash
```

The script will perform the following actions:

1. Download [docker-compose.yml](https://github.com/immich-app/immich/blob/main/docker/docker-compose.yml), and the [.env](https://github.com/immich-app/immich/blob/main/docker/.env.example) file from the main branch of the [repository](https://github.com/immich-app/immich).
2. Populate the `.env` file with necessary information based on the current directory path.
3. Start the containers.

The web application will be available at `http://<machine-ip-address>:2283`, and the server URL for the mobile app will be `http://<machine-ip-address>:2283/api`

The directory which is used to store the backup file is `./immich-app/immich-data` relative to the current directory.

:::tip
For more information on how to use the application, please refer to the [Post Installation](/docs/usage/post-installation) guide.
:::