import {
  AfterDeleteTrigger,
  BeforeUpdateTrigger,
  Column,
  DeleteDateColumn,
  ForeignKeyColumn,
  type Generated,
  Index,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  TriggerFunction,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UpdateIdColumn } from 'src/decorators.js';
import { AssetVisibility, SourceType } from 'src/enum.js';
import { asset_face_source_type, asset_visibility_enum } from 'src/schema/enums.js';
import { asset_face_audit, asset_face_set_asset_state, updated_at } from 'src/schema/functions.js';
import { AssetTable } from 'src/schema/tables/asset.table.js';
import { PersonGroupTable } from 'src/schema/tables/person-group.table.js';

@Table({ name: 'asset_face' })
@BeforeUpdateTrigger({
  name: 'asset_face_updatedAt',
  scope: 'row',
  function: updated_at,
  // these are internal optimizations, not to be synced to the client
  when: '(OLD."ownerId", OLD."assetVisibility", OLD."assetDeletedAt") IS NOT DISTINCT FROM (NEW."ownerId", NEW."assetVisibility", NEW."assetDeletedAt")',
})
@TriggerFunction({ timing: 'before', actions: ['insert'], scope: 'row', function: asset_face_set_asset_state })
@AfterDeleteTrigger({
  scope: 'statement',
  function: asset_face_audit,
  referencingOldTableAs: 'old',
  when: 'pg_trigger_depth() = 0',
})
// schemaFromDatabase does not preserve column order
@Index({ name: 'asset_face_assetId_personGroupId_idx', columns: ['assetId', 'personGroupId'] })
@Index({
  name: 'asset_face_personGroupId_assetId_notDeleted_isVisible_idx',
  columns: ['personGroupId', 'assetId'],
  where: '"deletedAt" IS NULL AND "isVisible" IS TRUE',
})
@Index({ columns: ['personGroupId', 'assetId'] })
@Index({
  name: 'asset_face_personGroupId_ownerId_assetId_timeline_idx',
  columns: ['personGroupId', 'ownerId', 'assetId'],
  where: `"deletedAt" IS NULL AND "isVisible" IS TRUE AND "assetVisibility" = 'timeline' AND "assetDeletedAt" IS NULL`,
})
export class AssetFaceTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => AssetTable, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    // [assetId, personGroupId] is the PK constraint
    index: false,
  })
  assetId!: string;

  @ForeignKeyColumn(() => PersonGroupTable, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    nullable: true,
    // [personGroupId, assetId] makes this redundant
    index: false,
  })
  personGroupId!: string | null;

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

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;

  @Column({ type: 'boolean', default: true })
  isVisible!: Generated<boolean>;

  // copied from the asset by triggers, so face queries can filter on them without joining asset
  @Column({ type: 'uuid' })
  ownerId!: Generated<string>;

  @Column({ enum: asset_visibility_enum })
  assetVisibility!: Generated<AssetVisibility>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  assetDeletedAt!: Timestamp | null;
}
