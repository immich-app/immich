import { UserEntity } from '@app/database';

export interface IUserDeletionJob {
  /**
   * The user entity that was saved in the database
   */
  user: UserEntity;
}
