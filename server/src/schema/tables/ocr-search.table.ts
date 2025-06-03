import { AssetTable } from 'src/schema/tables/asset.table';
import { Column, ForeignKeyColumn, Table } from 'src/sql-tools';

@Table('ocr_search')
export class OcrSearchTable {
  @ForeignKeyColumn(() => AssetTable, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
  })
  assetId!: string;

  @Column({ type: 'text' })
  text!: string;
} 