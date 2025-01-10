import { Insertable } from 'kysely';
import { ApiKeys } from 'src/db';
import { APIKeyEntity } from 'src/entities/api-key.entity';
import { AuthApiKey } from 'src/types';

export const IKeyRepository = 'IKeyRepository';

export interface IKeyRepository {
  create(dto: Insertable<ApiKeys>): Promise<APIKeyEntity>;
  update(userId: string, id: string, dto: Partial<APIKeyEntity>): Promise<APIKeyEntity>;
  delete(userId: string, id: string): Promise<void>;
  /**
   * Includes the hashed `key` for verification
   * @param id
   */
  getKey(hashedToken: string): Promise<AuthApiKey | undefined>;
  getById(userId: string, id: string): Promise<APIKeyEntity | null>;
  getByUserId(userId: string): Promise<APIKeyEntity[]>;
}
