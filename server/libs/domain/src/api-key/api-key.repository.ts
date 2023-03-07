import type { ApiKey, Prisma, User } from '@prisma/client';

export const IKeyRepository = 'IKeyRepository';

export interface IKeyRepository {
  create(data: Prisma.ApiKeyUncheckedCreateInput): Promise<ApiKey>;
  update(userId: string, id: string, data: Prisma.ApiKeyUpdateInput): Promise<ApiKey>;
  delete(userId: string, id: string): Promise<ApiKey>;
  deleteAll(userId: string): Promise<Prisma.BatchPayload>;
  /**
   * Includes the hashed `key` for verification
   */
  getKey(hashedToken: string): Promise<(ApiKey & { user: User }) | null>;
  getById(userId: string, id: string): Promise<ApiKey | null>;
  getByUserId(userId: string): Promise<ApiKey[]>;
}
