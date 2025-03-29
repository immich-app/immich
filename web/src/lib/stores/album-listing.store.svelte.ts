import { getAllAlbums, type AlbumResponseDto } from '@immich/sdk';

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
  let isLoadedAtLeastOnce = $state(false);
  let isLoading = $state(false);
  let albums = $state<AlbumResponseDto[]>([]);
  let sharedAlbums = $state<AlbumResponseDto[]>([]);

  // data must be cleared on logout
  const reset = () => {
    albums = [];
    sharedAlbums = [];
    isLoadedAtLeastOnce = false;
    isLoading = false;
  };

  const fetchJob = () =>
    Promise.all([getAllAlbums({}), getAllAlbums({ shared: true })]).then(([_albums, _sharedAlbums]) => {
      albums = _albums;
      sharedAlbums = _sharedAlbums;
      return [_albums, _sharedAlbums];
    });

  const refetchAlbums = async (): Promise<void> => {
    if (isLoading) {
      return;
    }
    isLoading = true;
    try {
      await fetchJob();
      isLoadedAtLeastOnce = true;
    } finally {
      isLoading = false;
    }
  };

  const getAlbums = async (): Promise<AlbumsListingResponse> => {
    if (isLoadedAtLeastOnce) {
      return {
        albums: $state.snapshot(albums),
        sharedAlbums: $state.snapshot(sharedAlbums),
        isCached: true,
      };
    }
    await refetchAlbums();
    return {
      albums: $state.snapshot(albums),
      sharedAlbums: $state.snapshot(sharedAlbums),
      isCached: false,
    };
  };

  const ensureLoaded = () => getAlbums();

  return {
    get albums() {
      return $state.snapshot(albums);
    },
    get sharedAlbums() {
      return $state.snapshot(sharedAlbums);
    },
    get isLoading() {
      return $state.snapshot(isLoading);
    },
    getAlbums,
    refetchAlbums,
    ensureLoaded,
    reset,
  };
}

export const albumListingStore = createAlbumListingStore();
