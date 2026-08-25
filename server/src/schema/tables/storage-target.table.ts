import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  Unique,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { StorageTargetKind, StorageTransferDirection, StorageTransferStatus } from 'src/enum';
import { AssetTable } from 'src/schema/tables/asset.table';
import { UserTable } from 'src/schema/tables/user.table';
import { StorageTargetConfig, StorageTargetSecret, StorageTransferScope } from 'src/types';

@Table('storage_target')
@UpdatedAtTrigger('storage_target_updatedAt')
@Unique({ columns: ['name'] })
export class StorageTargetTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @Column()
  name!: string;

  @Column()
  kind!: StorageTargetKind;

  /** Non-secret connection details, shape depends on `kind` */
  @Column({ type: 'jsonb' })
  config!: StorageTargetConfig;

  /** Credentials. Never returned by the API. */
  @Column({ type: 'jsonb' })
  secret!: StorageTargetSecret;

  @Column({ type: 'boolean', default: true })
  isEnabled!: Generated<boolean>;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}

@Table('storage_target_transfer')
@UpdatedAtTrigger('storage_target_transfer_updatedAt')
export class StorageTargetTransferTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => StorageTargetTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  targetId!: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  ownerId!: string;

  @Column()
  direction!: StorageTransferDirection;

  @Column()
  status!: StorageTransferStatus;

  @Column({ type: 'jsonb' })
  scope!: StorageTransferScope;

  @Column({ type: 'integer', default: 0 })
  totalCount!: Generated<number>;

  @Column({ type: 'integer', default: 0 })
  completedCount!: Generated<number>;

  @Column({ type: 'integer', default: 0 })
  failedCount!: Generated<number>;

  @Column({ type: 'timestamp with time zone', nullable: true, default: null })
  startedAt!: Timestamp | null;

  @Column({ type: 'timestamp with time zone', nullable: true, default: null })
  finishedAt!: Timestamp | null;

  @Column({ type: 'character varying', nullable: true, default: null })
  error!: string | null;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}

/**
 * Ledger of objects known to exist on a target. Doubles as the idempotency key for
 * both directions: export skips assets already recorded, import skips remote keys
 * already recorded.
 */
@Table('storage_target_object')
@Unique({ columns: ['targetId', 'remoteKey'] })
export class StorageTargetObjectTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => StorageTargetTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', index: false })
  targetId!: string;

  @Column()
  remoteKey!: string;

  /** Null when the remote object has no corresponding local asset (yet). */
  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: true })
  assetId!: string | null;

  @Column({ type: 'bigint' })
  size!: number;

  @Column({ type: 'bytea', nullable: true, default: null })
  checksum!: Buffer | null;

  @CreateDateColumn()
  syncedAt!: Generated<Timestamp>;
}
