import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { album_asset_after_insert, album_assets_delete_audit } from 'src/schema/functions';
import { AlbumTable } from 'src/schema/tables/album.table';
import { AssetTable } from 'src/schema/tables/asset.table';
import {
  AfterDeleteTrigger,
  AfterInsertTrigger,
  CreateDateColumn,
  ForeignKeyColumn,
  Table,
  UpdateDateColumn,
} from 'src/sql-tools';

@Table({ name: 'albums_assets_assets', primaryConstraintName: 'PK_c67bc36fa845fb7b18e0e398180' })
@UpdatedAtTrigger('album_assets_updated_at')
@AfterInsertTrigger({
  name: 'album_asset_after_insert',
  scope: 'statement',
  referencingNewTableAs: 'inserted_rows',
  function: album_asset_after_insert,
})
@AfterDeleteTrigger({
  name: 'album_assets_delete_audit',
  scope: 'statement',
  function: album_assets_delete_audit,
  referencingOldTableAs: 'old',
  when: 'pg_trigger_depth() <= 1',
})
export class AlbumAssetTable {
  @ForeignKeyColumn(() => AlbumTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false, primary: true })
  albumsId!: string;

  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false, primary: true })
  assetsId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateIdColumn({ indexName: 'IDX_album_assets_assets_update_id' })
  updateId?: string;

  @UpdateDateColumn()
  updatedAt!: Date;
}
