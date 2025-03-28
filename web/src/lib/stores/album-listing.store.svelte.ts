import { getAllAlbums, type AlbumResponseDto } from '@immich/sdk';
import { get, readonly, writable } from 'svelte/store';

// Album Listing Store
// For use in ui elements such as
// - +Page /albums (loads both shared and owned albums)
// - AddToAlbumAction's AlbumSelectionModal

type AlbumsListingResponse = {
  albums: AlbumResponseDto[];
  sharedAlbums: AlbumResponseDto[];
  isCached: boolean;
};

function createAlbumListingStore() {
  const isLoadedAtLeastOnce = writable<boolean>(false);
  const isLoading = writable<boolean>(false);
  const albums = writable<AlbumResponseDto[]>([]);
  const sharedAlbums = writable<AlbumResponseDto[]>([]);

  // data must be cleared on logout
  const reset = () => {
    albums.set([]);
    sharedAlbums.set([]);
    isLoadedAtLeastOnce.set(false);
    isLoading.set(false);
  };

  const fetchJob = () =>
    Promise.all([getAllAlbums({}), getAllAlbums({ shared: true })]).then(([_albums, _sharedAlbums]) => {
      albums.set(_albums);
      sharedAlbums.set(_sharedAlbums);
      return [_albums, _sharedAlbums];
    });

  const refetchAlbums = async (): Promise<AlbumsListingResponse> => {
    isLoading.set(true);
    try {
      const [_albums, _sharedAlbums] = await fetchJob();
      isLoadedAtLeastOnce.set(true);
      return {
        albums: _albums,
        sharedAlbums: _sharedAlbums,
        isCached: false,
      };
    } finally {
      isLoading.set(false);
    }
  };

  const getAlbums = async (): Promise<AlbumsListingResponse> => {
    if (get(isLoadedAtLeastOnce)) {
      return {
        albums: get(albums),
        sharedAlbums: get(sharedAlbums),
        isCached: true,
      };
    }
    return refetchAlbums();
  };

  const ensureLoaded = () => getAlbums();

  return {
    albums: readonly(albums),
    sharedAlbums: readonly(sharedAlbums),
    isLoading: readonly(isLoading),
    getAlbums,
    refetchAlbums,
    ensureLoaded,
    reset,
  };
}

export const albumListingStore = createAlbumListingStore();
