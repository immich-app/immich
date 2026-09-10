import {
  AfterDeleteTrigger,
  CreateDateColumn,
  ForeignKeyColumn,
  type Generated,
  Table,
  Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators.js';
import { memory_asset_delete_audit } from 'src/schema/functions.js';
import { AssetTable } from 'src/schema/tables/asset.table.js';
import { MemoryTable } from 'src/schema/tables/memory.table.js';

@Table('memory_asset')
@UpdatedAtTrigger('memory_asset_updatedAt')
@AfterDeleteTrigger({
  scope: 'statement',
  function: memory_asset_delete_audit,
  referencingOldTableAs: 'old',
  when: 'pg_trigger_depth() <= 1',
})
export class MemoryAssetTable {
  @ForeignKeyColumn(() => MemoryTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', primary: true })
  memoriesId!: string;

  @ForeignKeyColumn(() => AssetTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', primary: true })
  assetId!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
