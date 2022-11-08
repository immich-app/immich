import { UserEntity } from '@app/database/entities/user.entity';

export interface IUserDeletionJob {
  /**
   * The user entity that was saved in the database
   */
  user: UserEntity;
}
