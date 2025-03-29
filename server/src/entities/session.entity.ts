import { ExpressionBuilder } from 'kysely';
import { DB } from 'src/db';
import { UserEntity } from 'src/entities/user.entity';

export class SessionEntity {
  id!: string;
  token!: string;
  userId!: string;
  user!: UserEntity;
  createdAt!: Date;
  updatedAt!: Date;
  updateId!: string;
  deviceType!: string;
  deviceOS!: string;
}

const userColumns = [
  'id',
  'email',
  'createdAt',
  'profileImagePath',
  'isAdmin',
  'shouldChangePassword',
  'deletedAt',
  'oauthId',
  'updatedAt',
  'storageLabel',
  'name',
  'quotaSizeInBytes',
  'quotaUsageInBytes',
  'status',
  'profileChangedAt',
] as const;

export const withUser = (eb: ExpressionBuilder<DB, 'sessions'>) => {
  return eb
    .selectFrom('users')
    .select(userColumns)
    .select((eb) =>
      eb
        .selectFrom('user_metadata')
        .whereRef('users.id', '=', 'user_metadata.userId')
        .select((eb) => eb.fn('array_agg', [eb.table('user_metadata')]).as('metadata'))
        .as('metadata'),
    )
    .whereRef('users.id', '=', 'sessions.userId')
    .where('users.deletedAt', 'is', null)
    .as('user');
};
