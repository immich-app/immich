import {
  getAllAlbums,
  type AlbumResponseDto,
  type BulkIdResponseDto,
  type BulkIdsDto,
  type CreateAlbumDto,
  type TagBulkAssetsDto,
  type TagBulkAssetsResponseDto,
} from '@immich/sdk';

declare module 'extism:host' {
  interface user extends Record<
    (typeof availableFunctions)[number],
    (ptr: PTR) => I64
  > {}
}

type AlbumsToAssets = {
  assetIds: string[];
  albumIds: string[];
};

type HostFunctionSuccessResult<T> = { success: true; response: T };
type HostFunctionErrorResult = {
  success: false;
  status: number;
  message: string;
};
type HostFunctionResult<T> =
  | HostFunctionSuccessResult<T>
  | HostFunctionErrorResult;

type QueryParams<T extends (...args: any) => any> = Parameters<T>[0];
type AlbumSearchDto = QueryParams<typeof getAllAlbums>;
type HttpRequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};
type HttpResponse = {
  ok: string;
  status: number;
  body: string;
};

export const availableFunctions = [
  'searchAlbums',
  'createAlbum',
  'addAssetsToAlbum',
  'addAssetsToAlbums',
  'httpRequest',
  'bulkTagAssets',
] as const;

export const hostFunctions = (authToken: string) => {
  const host = Host.getFunctions();
  type HostFunctionName = keyof typeof host;

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

  return {
    // album
    searchAlbums: (dto: AlbumSearchDto) =>
      call<[AlbumSearchDto], AlbumResponseDto[]>('searchAlbums', authToken, [
        dto,
      ]),
    createAlbum: (dto: CreateAlbumDto) =>
      call<[CreateAlbumDto], AlbumResponseDto>('createAlbum', authToken, [dto]),
    addAssetsToAlbum: (albumId: string, assetIds: string[]) =>
      call<[string, BulkIdsDto], BulkIdResponseDto[]>(
        'addAssetsToAlbum',
        authToken,
        [albumId, { ids: assetIds }],
      ),
    addAssetsToAlbums: ({ assetIds, albumIds }: AlbumsToAssets) =>
      call('addAssetsToAlbums', authToken, [{ albumIds, assetIds }]),
    httpRequest: (url: string, options?: HttpRequestOptions) =>
      call<[string, HttpRequestOptions | undefined], HttpResponse>(
        'httpRequest',
        authToken,
        [url, options],
      ),
    bulkTagAssets: (dto: TagBulkAssetsDto) =>
      call<[TagBulkAssetsDto], TagBulkAssetsResponseDto>(
        'bulkTagAssets',
        authToken,
        [dto],
      ),
  } satisfies Record<(typeof availableFunctions)[number], unknown>;
};
