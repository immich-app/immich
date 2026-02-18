import { PrimaryGeneratedUuidV7Column } from 'src/decorators';
import { IntegrityReportType } from 'src/enum';
import { AssetFileTable } from 'src/schema/tables/asset-file.table';
import { AssetTable } from 'src/schema/tables/asset.table';
import { Column, CreateDateColumn, ForeignKeyColumn, Generated, Table, Timestamp, Unique } from 'src/sql-tools';

@Table('integrity_report')
@Unique({ columns: ['type', 'path'] })
export class IntegrityReportTable {
  @PrimaryGeneratedUuidV7Column()
  id!: Generated<string>;

  @Column()
  type!: IntegrityReportType;

  @Column()
  path!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: true })
  assetId!: string | null;

  @ForeignKeyColumn(() => AssetFileTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: true })
  fileAssetId!: string | null;
}
