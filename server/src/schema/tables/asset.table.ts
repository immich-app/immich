import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { AssetStatus, AssetType, AssetVisibility } from 'src/enum';
import { asset_visibility_enum, assets_status_enum } from 'src/schema/enums';
import { assets_delete_audit } from 'src/schema/functions';
import { LibraryTable } from 'src/schema/tables/library.table';
import { StackTable } from 'src/schema/tables/stack.table';
import { UserTable } from 'src/schema/tables/user.table';
import {
  AfterDeleteTrigger,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ForeignKeyColumn,
  Generated,
  Index,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from 'src/sql-tools';
import { ASSET_CHECKSUM_CONSTRAINT } from 'src/utils/database';

@Table('assets')
@UpdatedAtTrigger('assets_updated_at')
@AfterDeleteTrigger({
  scope: 'statement',
  function: assets_delete_audit,
  referencingOldTableAs: 'old',
  when: 'pg_trigger_depth() = 0',
})
// Checksums must be unique per user and library
@Index({
  name: ASSET_CHECKSUM_CONSTRAINT,
  columns: ['ownerId', 'checksum'],
  unique: true,
  where: '("libraryId" IS NULL)',
})
@Index({
  name: 'UQ_assets_owner_library_checksum' + '',
  columns: ['ownerId', 'libraryId', 'checksum'],
  unique: true,
  where: '("libraryId" IS NOT NULL)',
})
@Index({
  name: 'idx_local_date_time',
  expression: `(("localDateTime" at time zone 'UTC')::date)`,
})
@Index({
  name: 'idx_local_date_time_month',
  expression: `(date_trunc('MONTH'::text, ("localDateTime" AT TIME ZONE 'UTC'::text)) AT TIME ZONE 'UTC'::text)`,
})
@Index({ name: 'IDX_originalPath_libraryId', columns: ['originalPath', 'libraryId'] })
@Index({ name: 'IDX_asset_id_stackId', columns: ['id', 'stackId'] })
@Index({
  name: 'idx_originalfilename_trigram',
  using: 'gin',
  expression: 'f_unaccent("originalFileName") gin_trgm_ops',
})
// For all assets, each originalpath must be unique per user and library
export class AssetTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @Column()
  deviceAssetId!: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  ownerId!: string;

  @Column()
  deviceId!: string;

  @Column()
  type!: AssetType;

  @Column()
  originalPath!: string;

  @Column({ type: 'timestamp with time zone', indexName: 'idx_asset_file_created_at' })
  fileCreatedAt!: Timestamp;

  @Column({ type: 'timestamp with time zone' })
  fileModifiedAt!: Timestamp;

  @Column({ type: 'boolean', default: false })
  isFavorite!: Generated<boolean>;

  @Column({ type: 'character varying', nullable: true })
  duration!: string | null;

  @Column({ type: 'character varying', nullable: true, default: '' })
  encodedVideoPath!: string | null;

  @Column({ type: 'bytea', index: true })
  checksum!: Buffer; // sha1 checksum

  @ForeignKeyColumn(() => AssetTable, { nullable: true, onUpdate: 'CASCADE', onDelete: 'SET NULL' })
  livePhotoVideoId!: string | null;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @Column({ index: true })
  originalFileName!: string;

  @Column({ nullable: true })
  sidecarPath!: string | null;

  @Column({ type: 'bytea', nullable: true })
  thumbhash!: Buffer | null;

  @Column({ type: 'boolean', default: false })
  isOffline!: Generated<boolean>;

  @ForeignKeyColumn(() => LibraryTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: true })
  libraryId!: string | null;

  @Column({ type: 'boolean', default: false })
  isExternal!: Generated<boolean>;

  @DeleteDateColumn()
  deletedAt!: Timestamp | null;

  @Column({ type: 'timestamp with time zone' })
  localDateTime!: Timestamp;

  @ForeignKeyColumn(() => StackTable, { nullable: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  stackId!: string | null;

  @Column({ type: 'uuid', nullable: true, indexName: 'IDX_assets_duplicateId' })
  duplicateId!: string | null;

  @Column({ enum: assets_status_enum, default: AssetStatus.ACTIVE })
  status!: Generated<AssetStatus>;

  @UpdateIdColumn({ indexName: 'IDX_assets_update_id' })
  updateId!: Generated<string>;

  @Column({ enum: asset_visibility_enum, default: AssetVisibility.TIMELINE })
  visibility!: Generated<AssetVisibility>;
}
