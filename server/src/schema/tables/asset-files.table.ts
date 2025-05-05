import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { AssetFileType } from 'src/enum';
import { AssetTable } from 'src/schema/tables/asset.table';
import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  PrimaryGeneratedColumn,
  Table,
  Unique,
  UpdateDateColumn,
} from 'src/sql-tools';

@Table('asset_files')
@Unique({ name: 'UQ_assetId_type', columns: ['assetId', 'type'] })
@UpdatedAtTrigger('asset_files_updated_at')
export class AssetFileTable {
  @PrimaryGeneratedColumn()
  id!: string;

  @ForeignKeyColumn(() => AssetTable, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    indexName: 'IDX_asset_files_assetId',
  })
  assetId?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column()
  type!: AssetFileType;

  @Column()
  path!: string;

  @UpdateIdColumn({ indexName: 'IDX_asset_files_update_id' })
  updateId?: string;
}
