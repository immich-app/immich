import { AssetTable } from 'src/schema/tables/asset.table';
import { Column, ForeignKeyColumn, PrimaryGeneratedColumn, Table } from 'src/sql-tools';

@Table('asset_ocr')
export class AssetOcrTable {
  @PrimaryGeneratedColumn()
  id!: string;

  @ForeignKeyColumn(() => AssetTable, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    index: false,
  })
  assetId!: string;

  @Column({ default: 0, type: 'integer' })
  boundingBoxX1!: number;

  @Column({ default: 0, type: 'integer' })
  boundingBoxY1!: number;

  @Column({ default: 0, type: 'integer' })
  boundingBoxX2!: number;

  @Column({ default: 0, type: 'integer' })
  boundingBoxY2!: number;

  @Column({ type: 'text' })
  text!: string;
}
