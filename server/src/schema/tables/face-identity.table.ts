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
import { PrimaryGeneratedUuidV7Column, UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { AssetFaceTable } from 'src/schema/tables/asset-face.table';

@Table('face_identity')
@UpdatedAtTrigger('face_identity_updatedAt')
@Check({ name: 'face_identity_type_chk', expression: `"type" IN ('person', 'pet')` })
@Index({
  name: 'face_identity_representativeFaceId_idx',
  columns: ['representativeFaceId'],
  where: '"representativeFaceId" IS NOT NULL',
})
export class FaceIdentityTable {
  @PrimaryGeneratedUuidV7Column()
  id!: Generated<string>;

  @Column({ type: 'character varying', default: 'person' })
  type!: Generated<string>;

  @ForeignKeyColumn(() => AssetFaceTable, { onDelete: 'SET NULL', nullable: true, index: false })
  representativeFaceId!: string | null;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
