import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { UserTable } from 'src/schema/tables/user.table';
import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from 'src/sql-tools';

@Table({ name: 'sessions', primaryConstraintName: 'PK_48cb6b5c20faa63157b3c1baf7f' })
@UpdatedAtTrigger('sessions_updated_at')
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

  @UpdateIdColumn({ indexName: 'IDX_sessions_update_id' })
  updateId!: Generated<string>;

  @Column({ type: 'boolean', default: false })
  isPendingSyncReset!: Generated<boolean>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  pinExpiresAt!: Timestamp | null;
}
