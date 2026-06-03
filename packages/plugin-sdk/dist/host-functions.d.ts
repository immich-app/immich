import { getAllAlbums, type AlbumResponseDto, type BulkIdResponseDto, type CreateAlbumDto } from '@immich/sdk';
declare module 'extism:host' {
    interface user {
        searchAlbums(ptr: PTR): I64;
        createAlbum(ptr: PTR): I64;
        addAssetsToAlbum(ptr: PTR): I64;
        addAssetsToAlbums(ptr: PTR): I64;
    }
}
type AlbumsToAssets = {
    assetIds: string[];
    albumIds: string[];
};
type QueryParams<T extends (...args: any) => any> = Parameters<T>[0];
type AlbumSearchDto = QueryParams<typeof getAllAlbums>;
export declare const hostFunctions: (authToken: string) => {
    searchAlbums: (dto: AlbumSearchDto) => AlbumResponseDto[];
    createAlbum: (dto: CreateAlbumDto) => AlbumResponseDto;
    addAssetsToAlbum: (albumId: string, assetIds: string[]) => BulkIdResponseDto[];
    addAssetsToAlbums: ({ assetIds, albumIds }: AlbumsToAssets) => unknown;
};
export {};
