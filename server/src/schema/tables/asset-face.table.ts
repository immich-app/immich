import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { SourceType } from 'src/enum';
import { asset_face_source_type } from 'src/schema/enums';
import { asset_face_audit } from 'src/schema/functions';
import { AssetTable } from 'src/schema/tables/asset.table';
import { PersonTable } from 'src/schema/tables/person.table';
import {
  AfterDeleteTrigger,
  Column,
  DeleteDateColumn,
  ForeignKeyColumn,
  Generated,
  Index,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from 'src/sql-tools';

@Table({ name: 'asset_face' })
@UpdatedAtTrigger('asset_face_updatedAt')
@AfterDeleteTrigger({
  scope: 'statement',
  function: asset_face_audit,
  referencingOldTableAs: 'old',
  when: 'pg_trigger_depth() = 0',
})
// schemaFromDatabase does not preserve column order
@Index({ name: 'asset_face_assetId_personId_idx', columns: ['assetId', 'personId'] })
@Index({ columns: ['personId', 'assetId'] })
export class AssetFaceTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => AssetTable, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    // [assetId, personId] is the PK constraint
    index: false,
  })
  assetId!: string;

  @ForeignKeyColumn(() => PersonTable, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    nullable: true,
    // [personId, assetId] makes this redundant
    index: false,
  })
  personId!: string | null;

  @Column({ default: 0, type: 'integer' })
  imageWidth!: Generated<number>;

  @Column({ default: 0, type: 'integer' })
  imageHeight!: Generated<number>;

  @Column({ default: 0, type: 'integer' })
  boundingBoxX1!: Generated<number>;

  @Column({ default: 0, type: 'integer' })
  boundingBoxY1!: Generated<number>;

  @Column({ default: 0, type: 'integer' })
  boundingBoxX2!: Generated<number>;

  @Column({ default: 0, type: 'integer' })
  boundingBoxY2!: Generated<number>;

  @Column({ default: SourceType.MachineLearning, enum: asset_face_source_type })
  sourceType!: Generated<SourceType>;

  @DeleteDateColumn()
  deletedAt!: Timestamp | null;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @UpdateIdColumn()
  updateId!: Generated<string>;

  @Column({ type: 'boolean', default: true })
  isVisible!: Generated<boolean>;
}
