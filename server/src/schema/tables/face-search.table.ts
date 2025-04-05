import { AssetFaceTable } from 'src/schema/tables/asset-face.table';
import { Column, ForeignKeyColumn, Index, Table } from 'src/sql-tools';

@Table({ name: 'face_search', primaryConstraintName: 'face_search_pkey' })
@Index({
  name: 'face_index',
  using: 'hnsw',
  expression: `embedding vector_cosine_ops`,
  with: 'ef_construction = 300, m = 16',
  synchronize: false,
})
export class FaceSearchTable {
  @ForeignKeyColumn(() => AssetFaceTable, {
    onDelete: 'CASCADE',
    primary: true,
    constraintName: 'face_search_faceId_fkey',
  })
  faceId!: string;

  @Column({ type: 'vector', length: 512, synchronize: false })
  embedding!: string;
}
