import { UploadTarget } from '../cores';
import path from 'node:path';
import { AlbumResponseDto } from 'immich-sdk';
import { ImmichApi } from '../api/client';

export class AlbumService {
  private readonly immichApi: ImmichApi;
  constructor(immichApi: ImmichApi) {
    this.immichApi = immichApi;
  }

  createAlbumCollection(targets: UploadTarget[]) {
    const albums = new Map<string, UploadTarget[]>();
    for (const target of targets) {
      const albumName = target.path.split(path.sep).slice(-2)[0];
      if (!albums.has(albumName)) {
        albums.set(albumName, []);
      }

      albums.get(albumName)?.push(target);
    }

    return albums;
  }

  async getAllAlbums(): Promise<AlbumResponseDto[]> {
    const { data } = await this.immichApi.albumApi.getAllAlbums(false);
    return data;
  }
}
