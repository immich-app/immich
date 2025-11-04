declare module 'main' {
  export function archiveAssetAction(): I32;
}

declare module 'extism:host' {
  interface user {
    updateAsset(ptr: PTR): I32;
    addAssetToAlbum(ptr: PTR): I32;
  }
}
