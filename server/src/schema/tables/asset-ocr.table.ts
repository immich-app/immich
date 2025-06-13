import { AssetTable } from 'src/schema/tables/asset.table';
import { Column, ForeignKeyColumn, PrimaryGeneratedColumn, Table } from 'src/sql-tools';

@Table('asset_ocr')
export class AssetOcrTable {
  @PrimaryGeneratedColumn()
  id!: string;

  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  assetId!: string;

  @Column({ type: 'text' })
  text!: string;

  @Column({ type: 'integer' })
  x1!: number;

  @Column({ type: 'integer' })
  y1!: number;

  @Column({ type: 'integer' })
  x2!: number;

  @Column({ type: 'integer' })
  y2!: number;

  @Column({ type: 'integer' })
  x3!: number;

  @Column({ type: 'integer' })
  y3!: number;

  @Column({ type: 'integer' })
  x4!: number;

  @Column({ type: 'integer' })
  y4!: number;

  @Column({ type: 'real' })
  boxScore!: number;

  @Column({ type: 'real' })
  textScore!: number;
}
