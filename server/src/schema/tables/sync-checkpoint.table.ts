import { SyncEntityType } from 'src/enum';
import { SessionTable } from 'src/schema/tables/session.table';
import {
  Column,
  ColumnIndex,
  CreateDateColumn,
  ForeignKeyColumn,
  PrimaryColumn,
  Table,
  UpdateDateColumn,
  UpdateIdColumn,
} from 'src/sql-tools';

@Table('session_sync_checkpoints')
export class SessionSyncCheckpointTable {
  @ForeignKeyColumn(() => SessionTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', primary: true })
  sessionId!: string;

  @PrimaryColumn({ type: 'character varying' })
  type!: SyncEntityType;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ColumnIndex('IDX_session_sync_checkpoints_update_id')
  @UpdateIdColumn()
  updateId!: string;

  @Column()
  ack!: string;
}
