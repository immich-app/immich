import { ColumnType } from 'kysely';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { UserAvatarColor, UserStatus } from 'src/enum';
import { users_delete_audit } from 'src/schema/functions';
import {
  AfterDeleteTrigger,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Index,
  PrimaryGeneratedColumn,
  Table,
  UpdateDateColumn,
} from 'src/sql-tools';

type Timestamp = ColumnType<Date, Date | string, Date | string>;
type Generated<T> =
  T extends ColumnType<infer S, infer I, infer U> ? ColumnType<S, I | undefined, U> : ColumnType<T, T | undefined, T>;

@Table('users')
@UpdatedAtTrigger('users_updated_at')
@AfterDeleteTrigger({
  name: 'users_delete_audit',
  scope: 'statement',
  function: users_delete_audit,
  referencingOldTableAs: 'old',
  when: 'pg_trigger_depth() = 0',
})
@Index({ name: 'IDX_users_updated_at_asc_id_asc', columns: ['updatedAt', 'id'] })
export class UserTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @Column({ unique: true })
  email!: string;

  @Column({ default: '' })
  password!: Generated<string>;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @Column({ default: '' })
  profileImagePath!: Generated<string>;

  @Column({ type: 'boolean', default: false })
  isAdmin!: Generated<boolean>;

  @Column({ type: 'boolean', default: true })
  shouldChangePassword!: Generated<boolean>;

  @Column({ default: null })
  avatarColor!: UserAvatarColor | null;

  @DeleteDateColumn()
  deletedAt!: Timestamp | null;

  @Column({ default: '' })
  oauthId!: Generated<string>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @Column({ unique: true, nullable: true, default: null })
  storageLabel!: string | null;

  @Column({ default: '' })
  name!: Generated<string>;

  @Column({ type: 'bigint', nullable: true })
  quotaSizeInBytes!: ColumnType<number> | null;

  @Column({ type: 'bigint', default: 0 })
  quotaUsageInBytes!: Generated<ColumnType<number>>;

  @Column({ type: 'character varying', default: UserStatus.ACTIVE })
  status!: Generated<UserStatus>;

  @Column({ type: 'timestamp with time zone', default: () => 'now()' })
  profileChangedAt!: Generated<Timestamp>;

  @UpdateIdColumn({ indexName: 'IDX_users_update_id' })
  updateId!: Generated<string>;
}
