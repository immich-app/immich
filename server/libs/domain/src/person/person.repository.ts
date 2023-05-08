import { AssetEntity, PersonEntity } from '@app/infra/entities';

export const IPersonRepository = 'IPersonRepository';

export interface IPersonRepository {
  getAll(userId: string): Promise<PersonEntity[]>;
  getById(userId: string, personId: string): Promise<PersonEntity | null>;
  getAssets(userId: string, id: string): Promise<AssetEntity[]>;

  create(entity: Partial<PersonEntity>): Promise<PersonEntity>;
  update(entity: Partial<PersonEntity>): Promise<PersonEntity>;
  deleteAll(): Promise<PersonEntity[]>;
}
