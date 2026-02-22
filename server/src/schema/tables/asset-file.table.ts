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
import { AssetFileType } from 'src/enum';
import { AssetTable } from 'src/schema/tables/asset.table';

@Table('asset_file')
@Unique({ columns: ['assetId', 'type', 'isEdited'] })
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

  @Column({ type: 'boolean', default: false })
  isEdited!: Generated<boolean>;

  @Column({ type: 'boolean', default: false })
  isProgressive!: Generated<boolean>;
}
