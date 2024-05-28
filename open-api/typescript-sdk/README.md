# @immich/sdk

A TypeScript SDK for interfacing with the [Immich](https://immich.app/) API.

## Install

```bash
npm i --save @immich/sdk
```

## Usage

For a more detailed example, check out the [`@immich/cli`](https://github.com/immich-app/immich/tree/main/cli).

```typescript
import { getAllAlbums, getMyUser, init } from "@immich/sdk";

const API_KEY = "<API_KEY>"; // process.env.IMMICH_API_KEY

init({ baseUrl: "https://demo.immich.app/api", apiKey: API_KEY });

const user = await getMyUser();
const albums = await getAllAlbums({});

console.log({ user, albums });
```
