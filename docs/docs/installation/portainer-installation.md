---
sidebar_position: 4
---

# Portainer

Install Immich using Portainer's Stack feature.

1. Go to "**Stacks**" in the left sidebar.
2. Click on "**Add stack**".
3. Give the stack a name (i.e. Immich), and select "**Web Editor**" as the build method.
4. Copy the content of the `docker-compose.yml` file from the [GitHub repository](https://raw.githubusercontent.com/immich-app/immich/main/docker/docker-compose.yml).
5. Replace `.env` with `stack.env` for all containers that need to use environment variables in the web editor.

<img
  src={require('./img/dot-env.png').default}
  width="50%"
  style={{border: '1px solid #ddd'}}
  alt="Dot Env Example"
/>

8. Click on "**Advanced Mode**" in the **Environment Variables** section.

<img
  src={require('./img/env-1.png').default}
  width="50%"
  style={{border: '1px solid #ddd'}}
  alt="Dot Env Example"
/>

9. Copy the content of the `.env.example` file from the [GitHub repository](https://raw.githubusercontent.com/immich-app/immich/main/docker/.env.example) and paste into the editor.
10. Switch back to "**Simple Mode**".

<img
  src={require('./img/env-2.png').default}
  width="50%"
  style={{border: '1px solid #ddd'}}
  alt="Dot Env Example"
/>

* Populate custom database information if necessary.
* Populate `UPLOAD_LOCATION` with your preferred location for storing backup assets.
* Populate a secret value for `JWT_SECRET`. You can use the command below to generate a secure key:

```bash title="Generate secure JWT_SECRET key"
openssl rand -base64 128
```

11. Click on "**Deploy the stack**".


:::tip
For more information on how to use the application, please refer to the [Post Installation](/docs/usage/post-installation) guide.
:::
