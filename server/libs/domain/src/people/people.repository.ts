import { PersonEntity, AssetEntity } from '@app/infra/entities';

export const IPeopleRepository = 'IPeopleRepository';

export interface IPeopleRepository {
  create(entity: Partial<PersonEntity>): Promise<PersonEntity>;
  getById(userId: string, personId: string): Promise<PersonEntity | null>;
  getAll(userId: string): Promise<PersonEntity[]>;
  getPersonAssets(id: string): Promise<AssetEntity[]>;
  save(entity: Partial<PersonEntity>): Promise<PersonEntity>;
}
