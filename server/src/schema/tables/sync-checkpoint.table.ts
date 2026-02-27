import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  PrimaryColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { SyncEntityType } from 'src/enum';
import { SessionTable } from 'src/schema/tables/session.table';

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
