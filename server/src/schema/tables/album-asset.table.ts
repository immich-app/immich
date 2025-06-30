import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { album_assets_delete_audit } from 'src/schema/functions';
import { AlbumTable } from 'src/schema/tables/album.table';
import { AssetTable } from 'src/schema/tables/asset.table';
import {
  AfterDeleteTrigger,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  Table,
  Timestamp,
  UpdateDateColumn,
} from 'src/sql-tools';

@Table({ name: 'albums_assets_assets', primaryConstraintName: 'PK_c67bc36fa845fb7b18e0e398180' })
@UpdatedAtTrigger('album_assets_updated_at')
@AfterDeleteTrigger({
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
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @UpdateIdColumn({ indexName: 'IDX_album_assets_update_id' })
  updateId!: Generated<string>;
}
