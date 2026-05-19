declare module 'extism:host' {
  interface user {
    albumAddAssets(ptr: PTR): I64;
    addAssetsToAlbums(ptr: PTR): I64;
  }
}

const host = Host.getFunctions();
type HostFunctionName = keyof typeof host;
type HostFunctionSuccessResult<T> = { success: true; response: T };
type HostFunctionErrorResult = {
  success: false;
  status: number;
  message: string;
};
type HostFunctionResult<T> =
  | HostFunctionSuccessResult<T>
  | HostFunctionErrorResult;

const call = <T, R>(name: HostFunctionName, authToken: string, args: T) => {
  const pointer1 = Memory.fromString(JSON.stringify({ authToken, args }));
  const fn = host[name];
  const handler = Memory.find(fn(pointer1.offset));

  try {
    const result = JSON.parse(handler.readString()) as HostFunctionResult<R>;

    if (result.success) {
      return result.response;
    }

    throw new Error(
      `Failed to call host function "${String(name)}", received ${result.status} - ${JSON.stringify(result.message)}`,
    );
  } finally {
    handler.free();
    pointer1.free();
  }
};

type AlbumsToAssets = {
  assetIds: string[];
  albumIds: string[];
};

export const hostFunctions = (authToken: string) => ({
  albumAddAssets: (albumId: string, assetIds: string[]) =>
    call('albumAddAssets', authToken, [albumId, { ids: assetIds }]),
  addAssetsToAlbums: ({ assetIds, albumIds }: AlbumsToAssets) =>
    call('addAssetsToAlbums', authToken, [{ albumIds, assetIds }]),
});
