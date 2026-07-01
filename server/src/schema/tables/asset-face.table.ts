import {
  AfterDeleteTrigger,
  AfterInsertTrigger,
  AfterUpdateTrigger,
  Column,
  DeleteDateColumn,
  ForeignKeyColumn,
  Generated,
  Index,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { SourceType } from 'src/enum';
import { asset_face_source_type } from 'src/schema/enums';
import {
  asset_face_audit,
  person_decrement_asset_count,
  person_increment_asset_count,
  person_update_asset_count,
} from 'src/schema/functions';
import { AssetTable } from 'src/schema/tables/asset.table';
import { PersonTable } from 'src/schema/tables/person.table';

@Table({ name: 'asset_face' })
@UpdatedAtTrigger('asset_face_updatedAt')
@AfterDeleteTrigger({
  scope: 'statement',
  function: asset_face_audit,
  referencingOldTableAs: 'old',
  when: 'pg_trigger_depth() = 0',
})
@AfterInsertTrigger({
  name: 'asset_face_insert_increment_person_asset_count_trigger',
  scope: 'row',
  function: person_increment_asset_count,
})
@AfterUpdateTrigger({
  name: 'asset_face_update_increment_person_asset_count_trigger',
  scope: 'row',
  function: person_update_asset_count,
})
@AfterDeleteTrigger({
  name: 'asset_face_delete_decrement_person_asset_count_trigger',
  scope: 'row',
  function: person_decrement_asset_count,
})
// schemaFromDatabase does not preserve column order
@Index({ name: 'asset_face_assetId_personId_idx', columns: ['assetId', 'personId'] })
@Index({
  name: 'asset_face_personId_assetId_notDeleted_isVisible_idx',
  columns: ['personId', 'assetId'],
  where: '"deletedAt" IS NULL AND "isVisible" IS TRUE',
})
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
