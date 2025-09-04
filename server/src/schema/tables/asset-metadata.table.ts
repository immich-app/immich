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
import { AssetMetadata, AssetMetadataItem } from 'src/types';

@UpdatedAtTrigger('asset_metadata_updated_at')
@Table('asset_metadata')
@AfterDeleteTrigger({
  scope: 'statement',
  function: asset_metadata_audit,
  referencingOldTableAs: 'old',
  when: 'pg_trigger_depth() = 0',
})
export class AssetMetadataTable<T extends keyof AssetMetadata = AssetMetadataKey> implements AssetMetadataItem<T> {
  @ForeignKeyColumn(() => AssetTable, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    primary: true,
    //  [assetId, key] is the PK constraint
    index: false,
  })
  assetId!: string;

  @PrimaryColumn({ type: 'character varying' })
  key!: T;

  @Column({ type: 'jsonb' })
  value!: AssetMetadata[T];

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;

  @UpdateDateColumn({ index: true })
  updatedAt!: Generated<Timestamp>;
}
