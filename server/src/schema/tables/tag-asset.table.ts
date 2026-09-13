import * as sqlTools from '@immich/sql-tools';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators.js';
import { tag_asset_delete_audit } from 'src/schema/functions.js';
import { AssetTable } from 'src/schema/tables/asset.table.js';
import { TagTable } from 'src/schema/tables/tag.table.js';

@sqlTools.Index({ columns: ['assetId', 'tagId'] })
@sqlTools.Table('tag_asset')
@UpdatedAtTrigger('tag_asset_updatedAt')
@sqlTools.AfterDeleteTrigger({
  scope: 'statement',
  function: tag_asset_delete_audit,
  referencingOldTableAs: 'old',
})
export class TagAssetTable {
  @sqlTools.ForeignKeyColumn(() => AssetTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', primary: true, index: true })
  assetId!: string;

  @sqlTools.ForeignKeyColumn(() => TagTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', primary: true, index: true })
  tagId!: string;

  @sqlTools.CreateDateColumn()
  createdAt!: sqlTools.Generated<sqlTools.Timestamp>;

  @sqlTools.UpdateDateColumn()
  updatedAt!: sqlTools.Generated<sqlTools.Timestamp>;

  @UpdateIdColumn({ index: true })
  updateId!: sqlTools.Generated<string>;
}
