import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { UserTable } from 'src/schema/tables/user.table';

@Table({ name: 'session' })
@UpdatedAtTrigger('session_updatedAt')
export class SessionTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  // TODO convert to byte[]
  @Column()
  token!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expiresAt!: Timestamp | null;

  @ForeignKeyColumn(() => UserTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  userId!: string;

  @ForeignKeyColumn(() => SessionTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', nullable: true })
  parentId!: string | null;

  @Column({ default: '' })
  deviceType!: Generated<string>;

  @Column({ default: '' })
  deviceOS!: Generated<string>;

  @Column({ nullable: true })
  appVersion!: string | null;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;

  @Column({ type: 'boolean', default: false })
  isPendingSyncReset!: Generated<boolean>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  pinExpiresAt!: Timestamp | null;
}
