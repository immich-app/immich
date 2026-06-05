import {
  AfterDeleteTrigger,
  Column,
  ForeignKeyColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
} from '@immich/sql-tools';
import { UpdateIdColumn } from 'src/decorators';
import { asset_ocr_delete_audit } from 'src/schema/functions';
import { AssetTable } from 'src/schema/tables/asset.table';

@Table('asset_ocr')
@AfterDeleteTrigger({
  scope: 'statement',
  function: asset_ocr_delete_audit,
  referencingOldTableAs: 'old',
  when: 'pg_trigger_depth() = 0',
})
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

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
