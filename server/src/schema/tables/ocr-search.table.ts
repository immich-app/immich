import { Column, ForeignKeyColumn, Index, Table } from '@immich/sql-tools';
import { AssetTable } from 'src/schema/tables/asset.table';

@Table('ocr_search')
@Index({
  name: 'idx_ocr_search_text',
  using: 'gin',
  expression: 'f_unaccent("text") gin_trgm_ops',
})
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
