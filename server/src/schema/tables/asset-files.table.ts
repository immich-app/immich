import { AssetEntity } from 'src/entities/asset.entity';
import { AssetFileType } from 'src/enum';
import {
  Column,
  ColumnIndex,
  CreateDateColumn,
  ForeignKeyColumn,
  PrimaryGeneratedColumn,
  Table,
  Unique,
  UpdateDateColumn,
  UpdateIdColumn,
} from 'src/sql-tools';

@Unique({ name: 'UQ_assetId_type', columns: ['assetId', 'type'] })
@Table('asset_files')
export class AssetFileTable {
  @PrimaryGeneratedColumn()
  id!: string;

  @ColumnIndex('IDX_asset_files_assetId')
  @ForeignKeyColumn(() => AssetEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  assetId?: AssetEntity;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ColumnIndex('IDX_asset_files_update_id')
  @UpdateIdColumn()
  updateId?: string;

  @Column()
  type!: AssetFileType;

  @Column()
  path!: string;
}
