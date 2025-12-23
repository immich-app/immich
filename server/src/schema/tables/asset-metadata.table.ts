import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { AssetMetadataKey } from 'src/enum';
import { asset_metadata_audit } from 'src/schema/functions';
import { AssetTable } from 'src/schema/tables/asset.table';
import {
  AfterDeleteTrigger,
  Column,
  ForeignKeyColumn,
  Generated,
  PrimaryColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from 'src/sql-tools';

@UpdatedAtTrigger('asset_metadata_updated_at')
@Table('asset_metadata')
@AfterDeleteTrigger({
  scope: 'statement',
  function: asset_metadata_audit,
  referencingOldTableAs: 'old',
  when: 'pg_trigger_depth() = 0',
})
export class AssetMetadataTable {
  @ForeignKeyColumn(() => AssetTable, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    primary: true,
    //  [assetId, key] is the PK constraint
    index: false,
  })
  assetId!: string;

  @PrimaryColumn({ type: 'character varying' })
  key!: AssetMetadataKey;

  @Column({ type: 'jsonb' })
  value!: object;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;

  @UpdateDateColumn({ index: true })
  updatedAt!: Generated<Timestamp>;
}
