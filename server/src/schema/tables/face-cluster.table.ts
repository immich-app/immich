import {
  AfterDeleteTrigger,
  Check,
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  Index,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { person_delete_audit } from 'src/schema/functions';
import { AssetFaceTable } from 'src/schema/tables/asset-face.table';

@Table('face_cluster')
@Index({
  name: 'idx_person_name_trigram',
  using: 'gin',
  expression: 'f_unaccent("name") gin_trgm_ops',
})
@UpdatedAtTrigger('face_cluster_updatedAt')
@AfterDeleteTrigger({
  scope: 'statement',
  function: person_delete_audit,
  referencingOldTableAs: 'old',
  when: 'pg_trigger_depth() = 0',
})
@Check({ name: 'face_cluster_birthDate_chk', expression: `"birthDate" <= CURRENT_DATE` })
export class FaceClusterTable {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @Column({ default: '' })
  name!: Generated<string>;

  @Column({ type: 'date', nullable: true })
  birthDate!: Timestamp | null;

  @ForeignKeyColumn(() => AssetFaceTable, { onDelete: 'SET NULL', nullable: true })
  featureFaceAssetId!: string | null;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
