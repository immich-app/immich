import { APIKeyEntity } from '@app/infra/entities';

export const IKeyRepository = 'IKeyRepository';

export interface IKeyRepository {
  create(dto: Partial<APIKeyEntity>): Promise<APIKeyEntity>;
  update(userId: string, id: string, dto: Partial<APIKeyEntity>): Promise<APIKeyEntity>;
  delete(userId: string, id: string): Promise<void>;
  /**
   * Includes the hashed `key` for verification
   * @param id
   */
  getKey(hashedToken: string): Promise<APIKeyEntity | null>;
  getById(userId: string, id: string): Promise<APIKeyEntity | null>;
  getByUserId(userId: string): Promise<APIKeyEntity[]>;
}
