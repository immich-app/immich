import { AlbumEntity } from '@app/infra/db/entities';
import { AddAssetsDto, AddUsersDto, CreateAlbumDto, GetAlbumsDto, RemoveAssetsDto, UpdateAlbumDto } from './dto';
import { AddAssetsResponseDto, AlbumCountResponseDto } from './response-dto';

export const IAlbumRepository = 'IAlbumRepository';

export interface IAlbumRepository {
  create(ownerId: string, createAlbumDto: CreateAlbumDto): Promise<AlbumEntity>;
  getList(ownerId: string, getAlbumsDto: GetAlbumsDto): Promise<AlbumEntity[]>;
  getPublicSharingList(ownerId: string): Promise<AlbumEntity[]>;
  get(albumId: string): Promise<AlbumEntity | undefined>;
  delete(album: AlbumEntity): Promise<void>;
  addSharedUsers(album: AlbumEntity, addUsersDto: AddUsersDto): Promise<AlbumEntity>;
  removeUser(album: AlbumEntity, userId: string): Promise<void>;
  removeAssets(album: AlbumEntity, removeAssets: RemoveAssetsDto): Promise<number>;
  addAssets(album: AlbumEntity, addAssetsDto: AddAssetsDto): Promise<AddAssetsResponseDto>;
  updateAlbum(album: AlbumEntity, updateAlbumDto: UpdateAlbumDto): Promise<AlbumEntity>;
  getListByAssetId(userId: string, assetId: string): Promise<AlbumEntity[]>;
  getCountByUserId(userId: string): Promise<AlbumCountResponseDto>;
  getSharedWithUserAlbumCount(userId: string, assetId: string): Promise<number>;
}
