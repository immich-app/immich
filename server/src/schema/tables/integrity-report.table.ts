import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  type Generated,
  Table,
  Timestamp,
  Unique,
} from '@immich/sql-tools';
import { PrimaryGeneratedUuidV7Column } from 'src/decorators.js';
import { IntegrityReport } from 'src/enum.js';
import { AssetFileTable } from 'src/schema/tables/asset-file.table.js';
import { AssetTable } from 'src/schema/tables/asset.table.js';

@Table('integrity_report')
@Unique({ columns: ['type', 'path'] })
export class IntegrityReportTable {
  @PrimaryGeneratedUuidV7Column()
  id!: Generated<string>;

  @Column()
  type!: IntegrityReport;

  @Column()
  path!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: true })
  assetId!: string | null;

  @ForeignKeyColumn(() => AssetFileTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: true })
  fileAssetId!: string | null;
}
