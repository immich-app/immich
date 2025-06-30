import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { AssetFileType } from 'src/enum';
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

@Table('asset_files')
@Unique({ name: 'UQ_assetId_type', columns: ['assetId', 'type'] })
@UpdatedAtTrigger('asset_files_updated_at')
export class AssetFileTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => AssetTable, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    indexName: 'IDX_asset_files_assetId',
  })
  assetId!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @Column()
  type!: AssetFileType;

  @Column()
  path!: string;

  @UpdateIdColumn({ indexName: 'IDX_asset_files_update_id' })
  updateId!: Generated<string>;
}
