// create unit test for user utils

import { UserEntity } from '@app/infra';
import { userUtils } from './user-utils';

describe('User Utilities', () => {
  describe('checkIsReadyForDeletion', () => {
    it('check that user is not ready to be deleted', () => {
      const result = userUtils.isReadyForDeletion({ deletedAt: new Date() } as UserEntity);
      expect(result).toBeFalsy();
    });

    it('check that user is ready to be deleted', () => {
      const aWeekAgo = new Date(new Date().getTime() - 8 * 86400000);
      const result = userUtils.isReadyForDeletion({ deletedAt: aWeekAgo } as UserEntity);
      expect(result).toBeTruthy();
    });
  });
});
