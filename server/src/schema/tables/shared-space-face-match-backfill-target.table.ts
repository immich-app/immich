import { CreateDateColumn, ForeignKeyColumn, Generated, Table, Timestamp, UpdateDateColumn } from '@immich/sql-tools';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { AssetTable } from 'src/schema/tables/asset.table';
import { SharedSpaceTable } from 'src/schema/tables/shared-space.table';

@Table('shared_space_face_match_backfill_target')
@UpdatedAtTrigger('shared_space_face_match_backfill_target_updatedAt')
export class SharedSpaceFaceMatchBackfillTargetTable {
  @ForeignKeyColumn(() => SharedSpaceTable, { onDelete: 'CASCADE', primary: true, index: false })
  spaceId!: string;

  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', primary: true })
  assetId!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
