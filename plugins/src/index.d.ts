declare module 'main' {
  export function filter_filename(): I32;
  export function action_add_to_album(): I32;
  export function archiveAssetAction(): I32;
}

declare module 'extism:host' {
  interface user {
    updateAsset(ptr: PTR): I32;
    addAssetToAlbum(ptr: PTR): I32;
  }
}
