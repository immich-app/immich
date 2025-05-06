import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { SyncEntityType } from 'src/enum';
import { SessionTable } from 'src/schema/tables/session.table';
import { Column, CreateDateColumn, ForeignKeyColumn, PrimaryColumn, Table, UpdateDateColumn } from 'src/sql-tools';

@Table('session_sync_checkpoints')
@UpdatedAtTrigger('session_sync_checkpoints_updated_at')
export class SessionSyncCheckpointTable {
  @ForeignKeyColumn(() => SessionTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', primary: true })
  sessionId!: string;

  @PrimaryColumn({ type: 'character varying' })
  type!: SyncEntityType;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column()
  ack!: string;

  @UpdateIdColumn({ indexName: 'IDX_session_sync_checkpoints_update_id' })
  updateId!: string;
}
