import { Column, ColumnIndex, ForeignKeyColumn, Table } from 'src/sql-tools';
import { AssetFaceTable } from 'src/tables/asset-face.table';

@Table({ name: 'face_search', primaryConstraintName: 'face_search_pkey' })
export class FaceSearchTable {
  @ForeignKeyColumn(() => AssetFaceTable, {
    onDelete: 'CASCADE',
    primary: true,
    constraintName: 'face_search_faceId_fkey',
  })
  faceId!: string;

  @ColumnIndex({ name: 'face_index', synchronize: false })
  @Column({ type: 'vector', array: true, length: 512, synchronize: false })
  embedding!: string;
}
