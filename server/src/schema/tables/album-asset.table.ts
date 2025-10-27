import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import {
  album_asset_delete_audit,
  album_asset_generate_aggregation_id,
  album_asset_sync_activity,
} from 'src/schema/functions';
import { AlbumTable } from 'src/schema/tables/album.table';
import { AssetTable } from 'src/schema/tables/asset.table';
import { UserTable } from 'src/schema/tables/user.table';
import {
  AfterDeleteTrigger,
  AfterInsertTrigger,
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  Table,
  Timestamp,
  TriggerFunction,
  UpdateDateColumn,
} from 'src/sql-tools';

@Table({ name: 'album_asset' })
@UpdatedAtTrigger('album_asset_updatedAt')
@TriggerFunction({
  timing: 'before',
  actions: ['insert'],
  scope: 'row',
  function: album_asset_generate_aggregation_id,
})
@AfterInsertTrigger({
  scope: 'statement',
  function: album_asset_sync_activity,
  referencingNewTableAs: 'inserted_rows',
  when: 'pg_trigger_depth() <= 1',
})
@AfterDeleteTrigger({
  scope: 'statement',
  function: album_asset_delete_audit,
  referencingOldTableAs: 'old',
  when: 'pg_trigger_depth() <= 1',
})
@AfterDeleteTrigger({
  scope: 'statement',
  function: album_asset_sync_activity,
  referencingOldTableAs: 'deleted_rows',
  when: 'pg_trigger_depth() <= 1',
})
export class AlbumAssetTable {
  @ForeignKeyColumn(() => AlbumTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false, primary: true })
  albumsId!: string;

  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false, primary: true })
  assetsId!: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: true, index: true })
  createdBy!: string | null;

  @Column({ type: 'uuid', nullable: true, index: true })
  aggregationId!: Generated<string> | null;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
