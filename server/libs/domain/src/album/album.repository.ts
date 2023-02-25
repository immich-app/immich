export const IAlbumRepository = 'IAlbumRepository';

export interface IAlbumRepository {
  deleteAll(userId: string): Promise<void>;
}
