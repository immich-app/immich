// copy from
// import '@immich/plugin-sdk/host-functions';
declare module 'extism:host' {
  interface user {
    albumAddAssets(ptr: PTR): I64;
    addAssetsToAlbums(ptr: PTR): I64;
  }
}

declare module 'main' {
  export function assetFileFilter(): I32;
  export function assetFavorite(): I32;
  export function assetVisibility(): I32;
  export function assetArchive(): I32;
  export function assetLock(): I32;
  export function assetTimeline(): I32;
  export function assetTrash(): I32;
  export function assetAddToAlbums(): I32;
}
