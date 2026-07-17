import { Column, CreateDateColumn, ForeignKeyColumn, Generated, Table, Timestamp, Unique } from '@immich/sql-tools';
import { PrimaryGeneratedUuidV7Column } from 'src/decorators';
import { IntegrityReport } from 'src/enum';
import { AssetFileTable } from 'src/schema/tables/asset-file.table';
import { AssetTable } from 'src/schema/tables/asset.table';

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
