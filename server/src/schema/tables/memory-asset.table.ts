import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { memory_assets_delete_audit } from 'src/schema/functions';
import { AssetTable } from 'src/schema/tables/asset.table';
import { MemoryTable } from 'src/schema/tables/memory.table';
import {
  AfterDeleteTrigger,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  Table,
  Timestamp,
  UpdateDateColumn,
} from 'src/sql-tools';

@Table('memories_assets_assets')
@UpdatedAtTrigger('memory_assets_updated_at')
@AfterDeleteTrigger({
  scope: 'statement',
  function: memory_assets_delete_audit,
  referencingOldTableAs: 'old',
  when: 'pg_trigger_depth() <= 1',
})
export class MemoryAssetTable {
  @ForeignKeyColumn(() => MemoryTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', primary: true })
  memoriesId!: string;

  @ForeignKeyColumn(() => AssetTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', primary: true })
  assetsId!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @UpdateIdColumn({ indexName: 'IDX_memory_assets_update_id' })
  updateId!: Generated<string>;
}
