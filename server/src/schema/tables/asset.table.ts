import { ASSET_CHECKSUM_CONSTRAINT } from 'src/entities/asset.entity';
import { AssetStatus, AssetType } from 'src/enum';
import { LibraryTable } from 'src/schema/tables/library.table';
import { StackTable } from 'src/schema/tables/stack.table';
import { UserTable } from 'src/schema/tables/user.table';
import {
  Column,
  ColumnIndex,
  CreateDateColumn,
  DeleteDateColumn,
  ForeignKeyColumn,
  Index,
  PrimaryGeneratedColumn,
  Table,
  UpdateDateColumn,
  UpdateIdColumn,
} from 'src/sql-tools';

@Table('assets')
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
@Index({ name: 'idx_local_date_time', expression: `(("localDateTime" AT TIME ZONE 'UTC'::text))::date` })
@Index({
  name: 'idx_local_date_time_month',
  expression: `(date_trunc('MONTH'::text, ("localDateTime" AT TIME ZONE 'UTC'::text)) AT TIME ZONE 'UTC'::text)`,
})
@Index({ name: 'IDX_originalPath_libraryId', columns: ['originalPath', 'libraryId'] })
@Index({ name: 'IDX_asset_id_stackId', columns: ['id', 'stackId'] })
@Index({
  name: 'idx_originalFileName_trigram',
  using: 'gin',
  expression: 'f_unaccent(("originalFileName")::text)',
})
// For all assets, each originalpath must be unique per user and library
export class AssetTable {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column()
  deviceAssetId!: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  ownerId!: string;

  @ForeignKeyColumn(() => LibraryTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: true })
  libraryId?: string | null;

  @Column()
  deviceId!: string;

  @Column()
  type!: AssetType;

  @Column({ type: 'enum', enum: AssetStatus, default: AssetStatus.ACTIVE })
  status!: AssetStatus;

  @Column()
  originalPath!: string;

  @Column({ type: 'bytea', nullable: true })
  thumbhash!: Buffer | null;

  @Column({ type: 'character varying', nullable: true, default: '' })
  encodedVideoPath!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ColumnIndex('IDX_assets_update_id')
  @UpdateIdColumn()
  updateId?: string;

  @DeleteDateColumn()
  deletedAt!: Date | null;

  @ColumnIndex('idx_asset_file_created_at')
  @Column({ type: 'timestamp with time zone', default: null })
  fileCreatedAt!: Date;

  @Column({ type: 'timestamp with time zone', default: null })
  localDateTime!: Date;

  @Column({ type: 'timestamp with time zone', default: null })
  fileModifiedAt!: Date;

  @Column({ type: 'boolean', default: false })
  isFavorite!: boolean;

  @Column({ type: 'boolean', default: false })
  isArchived!: boolean;

  @Column({ type: 'boolean', default: false })
  isExternal!: boolean;

  @Column({ type: 'boolean', default: false })
  isOffline!: boolean;

  @Column({ type: 'bytea' })
  @ColumnIndex()
  checksum!: Buffer; // sha1 checksum

  @Column({ type: 'character varying', nullable: true })
  duration!: string | null;

  @Column({ type: 'boolean', default: true })
  isVisible!: boolean;

  @ForeignKeyColumn(() => AssetTable, { nullable: true, onUpdate: 'CASCADE', onDelete: 'SET NULL' })
  livePhotoVideoId!: string | null;

  @Column()
  @ColumnIndex()
  originalFileName!: string;

  @Column({ nullable: true })
  sidecarPath!: string | null;

  @ForeignKeyColumn(() => StackTable, { nullable: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  stackId?: string | null;

  @ColumnIndex('IDX_assets_duplicateId')
  @Column({ type: 'uuid', nullable: true })
  duplicateId!: string | null;
}
