import { AssetTable } from 'src/schema/tables/asset.table';
import { Column, ForeignKeyColumn, Generated, PrimaryGeneratedColumn, Table } from 'src/sql-tools';

@Table('asset_ocr')
export class AssetOcrTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  assetId!: string;

  // box positions are normalized, with values between 0 and 1
  @Column({ type: 'real' })
  x1!: number;

  @Column({ type: 'real' })
  y1!: number;

  @Column({ type: 'real' })
  x2!: number;

  @Column({ type: 'real' })
  y2!: number;

  @Column({ type: 'real' })
  x3!: number;

  @Column({ type: 'real' })
  y3!: number;

  @Column({ type: 'real' })
  x4!: number;

  @Column({ type: 'real' })
  y4!: number;

  @Column({ type: 'real' })
  boxScore!: number;

  @Column({ type: 'real' })
  textScore!: number;

  @Column({ type: 'text' })
  text!: string;

  @Column({ type: 'boolean', default: true })
  isVisible!: Generated<boolean>;
}
