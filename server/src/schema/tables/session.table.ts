import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { UserTable } from 'src/schema/tables/user.table';
import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  PrimaryGeneratedColumn,
  Table,
  UpdateDateColumn,
} from 'src/sql-tools';

@Table({ name: 'sessions', primaryConstraintName: 'PK_48cb6b5c20faa63157b3c1baf7f' })
@UpdatedAtTrigger('sessions_updated_at')
export class SessionTable {
  @PrimaryGeneratedColumn()
  id!: string;

  // TODO convert to byte[]
  @Column()
  token!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expiresAt!: Date | null;

  @ForeignKeyColumn(() => UserTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  userId!: string;

  @ForeignKeyColumn(() => SessionTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', nullable: true })
  parentId!: string | null;

  @Column({ default: '' })
  deviceType!: string;

  @Column({ default: '' })
  deviceOS!: string;

  @UpdateIdColumn({ indexName: 'IDX_sessions_update_id' })
  updateId!: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  pinExpiresAt!: Date | null;
}
