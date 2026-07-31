import { Column, ForeignKeyColumn, Index, Table } from '@immich/sql-tools';
import { AssetTable } from 'src/schema/tables/asset.table';

/**
 * One row per asset, holding flattened transcript text for search — mirroring `ocr_search`.
 * Written once, at transcription completion, never per chunk: search should transition from
 * absent to fully present atomically rather than surfacing a half-indexed video as a partial hit.
 */
@Table('transcript_search')
@Index({
  name: 'idx_transcript_search_text',
  using: 'gin',
  expression: 'f_unaccent("text") gin_trgm_ops',
})
export class TranscriptSearchTable {
  @ForeignKeyColumn(() => AssetTable, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
  })
  assetId!: string;

  @Column({ type: 'text' })
  text!: string;
}
