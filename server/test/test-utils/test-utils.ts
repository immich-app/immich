import { AuthUserDto } from '@app/domain';
import { dataSource } from '@app/infra';
import { albumApi } from './album-utils';
import { assetApi } from './asset-utils';
import { authApi } from './auth-utils';
import { sharedLinkApi } from './shared-link-utils';
import { userApi } from './user-utils';

export const db = {
  reset: async () => {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    await dataSource.transaction(async (em) => {
      for (const entity of dataSource.entityMetadatas) {
        if (entity.tableName === 'users') {
          continue;
        }
        await em.query(`DELETE FROM ${entity.tableName} CASCADE;`);
      }
      await em.query(`DELETE FROM "users" CASCADE;`);
    });
  },
  disconnect: async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  },
};

export function getAuthUser(): AuthUserDto {
  return {
    id: '3108ac14-8afb-4b7e-87fd-39ebb6b79750',
    email: 'test@email.com',
    isAdmin: false,
  };
}

export const api = {
  authApi,
  assetApi,
  sharedLinkApi,
  albumApi,
  userApi,
};
