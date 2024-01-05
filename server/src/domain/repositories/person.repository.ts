import { AssetEntity, AssetFaceEntity, PersonEntity } from '@app/infra/entities';
import { FindManyOptions } from 'typeorm';
import { PaginationOptions, Paginated } from '../domain.util';

export const IPersonRepository = 'IPersonRepository';

export interface PersonSearchOptions {
  minimumFaceCount: number;
  withHidden: boolean;
}

export interface PersonNameSearchOptions {
  withHidden?: boolean;
}

export interface AssetFaceId {
  assetId: string;
  personId: string;
}

export interface UpdateFacesData {
  oldPersonId?: string;
  faceIds?: string[];
  newPersonId: string;
}

export interface PersonStatistics {
  assets: number;
}

export interface IPersonRepository {
  getAll(): Promise<PersonEntity[]>;
  getAllWithoutThumbnail(): Promise<PersonEntity[]>;
  getAllForUser(userId: string, options: PersonSearchOptions): Promise<PersonEntity[]>;
  getAllWithoutFaces(): Promise<PersonEntity[]>;
  getById(personId: string): Promise<PersonEntity | null>;
  getByName(userId: string, personName: string, options: PersonNameSearchOptions): Promise<PersonEntity[]>;

  getAssets(personId: string): Promise<AssetEntity[]>;

  reassignFaces(data: UpdateFacesData): Promise<number>;

  create(entity: Partial<PersonEntity>): Promise<PersonEntity>;
  update(entity: Partial<PersonEntity>): Promise<PersonEntity>;
  delete(entity: PersonEntity): Promise<PersonEntity | null>;
  deleteAll(): Promise<number>;
  getStatistics(personId: string): Promise<PersonStatistics>;
  getAllFaces(pagination: PaginationOptions, options: FindManyOptions<AssetFaceEntity>): Paginated<AssetFaceEntity>;
  getFacesByIds(ids: AssetFaceId[]): Promise<AssetFaceEntity[]>;
  getRandomFace(personId: string): Promise<AssetFaceEntity | null>;
  createFace(entity: Partial<AssetFaceEntity>): Promise<void>;
  getFaces(assetId: string): Promise<AssetFaceEntity[]>;
  reassignFace(assetFaceId: string, newPersonId: string): Promise<number>;
  getFaceById(id: string): Promise<AssetFaceEntity>;
  getFaceByIdWithAssets(id: string): Promise<AssetFaceEntity | null>;
}
