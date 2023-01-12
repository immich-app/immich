import { UserEntity } from '@app/infra';

export interface IUserDeletionJob {
  /**
   * The user entity that was saved in the database
   */
  user: UserEntity;
}
