import { APIKeyEntity } from '@app/infra/db/entities';

export const IKeyRepository = 'IKeyRepository';

export interface IKeyRepository {
  create(dto: Partial<APIKeyEntity>): Promise<APIKeyEntity>;
  update(userId: string, id: number, dto: Partial<APIKeyEntity>): Promise<APIKeyEntity>;
  delete(userId: string, id: number): Promise<void>;
  /**
   * Includes the hashed `key` for verification
   * @param id
   */
  getKey(hashedToken: string): Promise<APIKeyEntity | null>;
  getById(userId: string, id: number): Promise<APIKeyEntity | null>;
  getByUserId(userId: string): Promise<APIKeyEntity[]>;
}
