import {
  Check,
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  Index,
  Table,
  Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { AssetFaceTable } from 'src/schema/tables/asset-face.table';
import { FaceIdentityTable } from 'src/schema/tables/face-identity.table';

export type FaceIdentityFaceSource = 'owner-person' | 'ml' | 'backfill' | 'shared-space-evidence' | 'manual' | 'import';

@Table('face_identity_face')
@UpdatedAtTrigger('face_identity_face_updatedAt')
@Check({
  name: 'face_identity_face_source_chk',
  expression: `"source" IN ('owner-person', 'ml', 'backfill', 'shared-space-evidence', 'manual', 'import')`,
})
@Index({ name: 'face_identity_face_identityId_assetFaceId_idx', columns: ['identityId', 'assetFaceId'] })
export class FaceIdentityFaceTable {
  @ForeignKeyColumn(() => AssetFaceTable, { onDelete: 'CASCADE', primary: true, index: false })
  assetFaceId!: string;

  @ForeignKeyColumn(() => FaceIdentityTable, { onDelete: 'CASCADE', index: false })
  identityId!: string;

  @Column({ type: 'character varying', default: 'owner-person' })
  source!: Generated<FaceIdentityFaceSource>;

  @Column({ type: 'double precision', nullable: true })
  confidence!: number | null;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
