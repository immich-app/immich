import { AssetEntity, PersonEntity } from '@app/infra/entities';

export const IPersonRepository = 'IPersonRepository';

export interface PersonSearchOptions {
  minimumFaceCount: number;
}

export interface IPersonRepository {
  getAll(userId: string, options: PersonSearchOptions): Promise<PersonEntity[]>;
  getAllWithoutFaces(): Promise<PersonEntity[]>;
  getById(userId: string, personId: string): Promise<PersonEntity | null>;
  getAssets(userId: string, id: string): Promise<AssetEntity[]>;

  create(entity: Partial<PersonEntity>): Promise<PersonEntity>;
  update(entity: Partial<PersonEntity>): Promise<PersonEntity>;
  delete(entity: PersonEntity): Promise<PersonEntity | null>;
  deleteAll(): Promise<number>;
}
