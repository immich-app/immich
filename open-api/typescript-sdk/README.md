# @immich/sdk

A TypeScript SDK for interfacing with the [Immich](https://immich.app/) API.

## Install

```bash
npm i --save @immich/sdk
```

## Usage

For a more detailed example, check out the [`@immich/cli`](https://github.com/immich-app/immich/tree/main/cli).

```typescript
import { defaults, getAllAlbums, getAllAssets, getMyUserInfo } from "@immich/sdk";

const API_KEY = "<API_KEY>"; // process.env.IMMICH_API_KEY

defaults.baseUrl = "https://demo.immich.app/api";
defaults.headers = { "x-api-key": API_KEY };

const user = await getMyUserInfo();
const assets = await getAllAssets({ take: 1000 });
const albums = await getAllAlbums({});

console.log({ user, assets, albums });
```
