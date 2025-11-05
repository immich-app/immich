declare module 'main' {
  export function filterFileName(): I32;
  export function actionAddToAlbum(): I32;
  export function actionArchive(): I32;
}

declare module 'extism:host' {
  interface user {
    updateAsset(ptr: PTR): I32;
    addAssetToAlbum(ptr: PTR): I32;
  }
}
