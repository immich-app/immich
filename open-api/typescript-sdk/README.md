# @immich/sdk

A TypeScript SDK for interfacing with the [Immich](https://immich.app/) API.

## Install

```bash
npm i --save @immich/sdk
```

## Usage

For a more detailed example, check out the [`@immich/cli`](https://github.com/immich-app/immich/tree/main/cli).

```typescript
<<<<<<< HEAD
import { getAllAlbums, getAllAssets, getMyUser, init } from "@immich/sdk";
=======
import { getAllAlbums, getMyUserInfo, init } from "@immich/sdk";
>>>>>>> e7c8501930a988dfb6c23ce1c48b0beb076a58c2

const API_KEY = "<API_KEY>"; // process.env.IMMICH_API_KEY

init({ baseUrl: "https://demo.immich.app/api", apiKey: API_KEY });

<<<<<<< HEAD
const user = await getMyUser();
const assets = await getAllAssets({ take: 1000 });
=======
const user = await getMyUserInfo();
>>>>>>> e7c8501930a988dfb6c23ce1c48b0beb076a58c2
const albums = await getAllAlbums({});

console.log({ user, albums });
```
