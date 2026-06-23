// keep in sync with plugin-sdk/host-functions.ts';
declare module 'extism:host' {
  interface user {
    searchAlbums(ptr: PTR): I64;
    createAlbum(ptr: PTR): I64;
    addAssetsToAlbum(ptr: PTR): I64;
    addAssetsToAlbums(ptr: PTR): I64;
  }
}

// keep in sync with manifest.json
declare module 'main' {
  // filters
  export function assetFileFilter(): I32;
  export function assetMissingTimeZoneFilter(): I32;
  export function assetLocationFilter(): I32;
  export function assetTypeFilter(): I32;

  // updates
  export function assetFavorite(): I32;
  export function assetVisibility(): I32;
  export function assetArchive(): I32;
  export function assetLock(): I32;
  export function assetTimeline(): I32;
  export function assetTrash(): I32;
  export function assetAddToAlbums(): I32;
}
