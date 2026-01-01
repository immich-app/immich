import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { AssetFileType, StorageBackend } from 'src/enum';
import { storage_backend_enum } from 'src/schema/enums';
import { AssetTable } from 'src/schema/tables/asset.table';
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
} from 'src/sql-tools';

@Table('asset_file')
@Unique({ columns: ['assetId', 'type'] })
@UpdatedAtTrigger('asset_file_updatedAt')
export class AssetFileTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  assetId!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @Column()
  type!: AssetFileType;

  @Column()
  path!: string;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;

  // S3 storage columns
  @Column({ enum: storage_backend_enum, default: StorageBackend.Local })
  storageBackend!: Generated<StorageBackend>;

  @Column({ type: 'character varying', nullable: true })
  s3Bucket!: string | null;

  @Column({ type: 'character varying', nullable: true })
  s3Key!: string | null;
}
