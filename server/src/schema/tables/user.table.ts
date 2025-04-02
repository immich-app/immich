import { ColumnType } from 'kysely';
import { UserStatus } from 'src/enum';
import {
  Column,
  ColumnIndex,
  CreateDateColumn,
  DeleteDateColumn,
  Index,
  PrimaryGeneratedColumn,
  Table,
  UpdateDateColumn,
  UpdateIdColumn,
} from 'src/sql-tools';

type Timestamp = ColumnType<Date, Date | string, Date | string>;
type Generated<T> =
  T extends ColumnType<infer S, infer I, infer U> ? ColumnType<S, I | undefined, U> : ColumnType<T, T | undefined, T>;

@Table('users')
@Index({ name: 'IDX_users_updated_at_asc_id_asc', columns: ['updatedAt', 'id'] })
export class UserTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @Column({ default: '' })
  name!: Generated<string>;

  @Column({ type: 'boolean', default: false })
  isAdmin!: Generated<boolean>;

  @Column({ unique: true })
  email!: string;

  @Column({ unique: true, nullable: true, default: null })
  storageLabel!: string | null;

  @Column({ default: '' })
  password!: Generated<string>;

  @Column({ default: '' })
  oauthId!: Generated<string>;

  @Column({ default: '' })
  profileImagePath!: Generated<string>;

  @Column({ type: 'boolean', default: true })
  shouldChangePassword!: Generated<boolean>;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @DeleteDateColumn()
  deletedAt!: Timestamp | null;

  @Column({ type: 'character varying', default: UserStatus.ACTIVE })
  status!: Generated<UserStatus>;

  @ColumnIndex({ name: 'IDX_users_update_id' })
  @UpdateIdColumn()
  updateId!: Generated<string>;

  @Column({ type: 'bigint', nullable: true })
  quotaSizeInBytes!: ColumnType<number> | null;

  @Column({ type: 'bigint', default: 0 })
  quotaUsageInBytes!: Generated<ColumnType<number>>;

  @Column({ type: 'timestamp with time zone', default: () => 'now()' })
  profileChangedAt!: Generated<Timestamp>;
}
