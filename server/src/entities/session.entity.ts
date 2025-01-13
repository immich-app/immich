import { ExpressionBuilder } from 'kysely';
import { DB } from 'src/db';
import { UserEntity } from 'src/entities/user.entity';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('sessions')
export class SessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ select: false })
  token!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => UserEntity, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  user!: UserEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ default: '' })
  deviceType!: string;

  @Column({ default: '' })
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
