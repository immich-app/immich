import { AssetEntity, AssetFaceEntity, PersonEntity } from '@app/infra/entities';
import { FindManyOptions } from 'typeorm';
import { Paginated, PaginationOptions } from '../domain.util';

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
  getAllForUser(userId: string, options: PersonSearchOptions): Promise<PersonEntity[]>;
  getAllWithoutFaces(): Promise<PersonEntity[]>;
  getAllWithoutThumbnail(): Promise<PersonEntity[]>;
  getById(personId: string): Promise<PersonEntity | null>;
  getByName(userId: string, personName: string, options: PersonNameSearchOptions): Promise<PersonEntity[]>;

  getAssets(personId: string): Promise<AssetEntity[]>;

  create(entity: Partial<PersonEntity>): Promise<PersonEntity>;
  createFace(entity: Partial<AssetFaceEntity>): Promise<void>;
  delete(entities: PersonEntity | PersonEntity[]): Promise<void>;
  deleteAll(): Promise<void>;
  deleteAllFaces(): Promise<void>;
  getAllFaces(pagination: PaginationOptions, options: FindManyOptions<AssetFaceEntity>): Paginated<AssetFaceEntity>;
  getFaceById(id: string): Promise<AssetFaceEntity>;
  getFaceByIdWithAssets(id: string): Promise<AssetFaceEntity | null>;
  getFaceCount(): Promise<number>
  getFaces(assetId: string): Promise<AssetFaceEntity[]>;
  getFacesByIds(ids: AssetFaceId[]): Promise<AssetFaceEntity[]>;
  getRandomFace(personId: string): Promise<AssetFaceEntity | null>;
  getStatistics(personId: string): Promise<PersonStatistics>;
  reassignFace(assetFaceId: string, newPersonId: string): Promise<number>;
  reassignFaces(data: UpdateFacesData): Promise<number>;
  update(entity: Partial<PersonEntity>): Promise<PersonEntity>;
}
