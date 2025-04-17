import { getAllAlbums, type AlbumResponseDto } from '@immich/sdk';

// Album Listing Store
// For use in ui elements such as
// - +Page /albums (loads both shared and owned albums)
// - AddToAlbumAction's AlbumSelectionModal

type AlbumsListingResponse = {
  albums: AlbumResponseDto[];
  sharedAlbums: AlbumResponseDto[];
  recentAlbums: AlbumResponseDto[];
  isCached: boolean;
};

class AlbumListingStore {
  isLoadedAtLeastOnce = $state(false);
  isLoading = $state(false);
  albums = $state<AlbumResponseDto[]>([]);
  sharedAlbums = $state<AlbumResponseDto[]>([]);
  recentAlbums = $state<AlbumResponseDto[]>([]);

  async #parallelFetch() {
    return Promise.all([getAllAlbums({}), getAllAlbums({ shared: true })]).then(([_albums, _sharedAlbums]) => {
      this.albums = _albums;
      this.recentAlbums = _albums.sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : 1)).slice(0, 3);
      this.sharedAlbums = _sharedAlbums;
      return [_albums, _sharedAlbums];
    });
  }

  async refetchAlbums(): Promise<void> {
    if (this.isLoading) {
      return;
    }
    this.isLoading = true;
    try {
      await this.#parallelFetch();
      this.isLoadedAtLeastOnce = true;
    } finally {
      this.isLoading = false;
    }
  }

  public updateAlbumLocally(album: AlbumResponseDto) {
    this.albums[this.albums.findIndex(({ id }) => id === album.id)] = album;
    this.sharedAlbums[this.sharedAlbums.findIndex(({ id }) => id === album.id)] = album;
  }

  public async getAlbums(): Promise<AlbumsListingResponse> {
    if (this.isLoadedAtLeastOnce) {
      return {
        albums: this.albums,
        sharedAlbums: this.sharedAlbums,
        recentAlbums: this.recentAlbums,
        isCached: true,
      };
    }
    await this.refetchAlbums();
    return {
      albums: this.albums,
      sharedAlbums: this.sharedAlbums,
      recentAlbums: this.recentAlbums,
      isCached: false,
    };
  }

  public ensureLoaded = () => this.getAlbums();

  // data must be cleared on logout
  public reset() {
    this.albums = [];
    this.sharedAlbums = [];
    this.isLoadedAtLeastOnce = false;
    this.isLoading = false;
  }
}

export const albumListingStore = new AlbumListingStore();
