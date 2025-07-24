import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { SyncEntityType } from 'src/enum';
import { SessionTable } from 'src/schema/tables/session.table';
import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  PrimaryColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from 'src/sql-tools';

@Table('session_sync_checkpoint')
@UpdatedAtTrigger('session_sync_checkpoint_updatedAt')
export class SessionSyncCheckpointTable {
  @ForeignKeyColumn(() => SessionTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', primary: true })
  sessionId!: string;

  @PrimaryColumn({ type: 'character varying' })
  type!: SyncEntityType;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @Column()
  ack!: string;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
