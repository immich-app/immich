import { AssetFaceId } from '@app/domain';
import { AssetEntity, AssetFaceEntity, PersonEntity } from '@app/infra/entities';
export const IPersonRepository = 'IPersonRepository';

export interface PersonSearchOptions {
  minimumFaceCount: number;
}

export interface updateFacesData {
  oldPersonId: string;
  newPersonId: string;
}

export interface IPersonRepository {
  getAll(userId: string, options: PersonSearchOptions): Promise<PersonEntity[]>;
  getAllWithoutFaces(): Promise<PersonEntity[]>;
  getById(userId: string, personId: string): Promise<PersonEntity | null>;

  getAssets(userId: string, personId: string): Promise<AssetEntity[]>;
  deleteFacesForSharedAssets(data: updateFacesData): Promise<string[]>;
  reassignFaces(data: updateFacesData): Promise<number>;

  create(entity: Partial<PersonEntity>): Promise<PersonEntity>;
  update(entity: Partial<PersonEntity>): Promise<PersonEntity>;
  delete(entity: PersonEntity): Promise<PersonEntity | null>;
  deleteAll(): Promise<number>;

  getFaceById(payload: AssetFaceId): Promise<AssetFaceEntity | null>;
}
