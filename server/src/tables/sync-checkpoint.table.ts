import { SyncEntityType } from 'src/enum';
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
import { SessionTable } from 'src/tables/session.table';

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
