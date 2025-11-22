import { AssetTable } from 'src/schema/tables/asset.table';
import { Column, CreateDateColumn, ForeignKeyColumn, Generated, Index, Table, Timestamp } from 'src/sql-tools';

@Table('asset_hash')
@Index({ columns: ['phash'] })
export class AssetHashTable {
  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', primary: true })
  assetId!: string;

  // DCT-based perceptual hash (256-bit stored as BIT(256) for Hamming distance queries)
  // TypeScript type is 'text' but migration creates BIT(256) column
  @Column({ type: 'text', nullable: true })
  phash!: string | null;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;
}
