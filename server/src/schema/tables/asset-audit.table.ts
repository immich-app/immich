import { PrimaryGeneratedUuidV7Column } from 'src/decorators';
import { Column, ColumnIndex, CreateDateColumn, Table } from 'src/sql-tools';

@Table('assets_audit')
export class AssetAuditTable {
  @PrimaryGeneratedUuidV7Column()
  id!: string;

  @ColumnIndex('IDX_assets_audit_asset_id')
  @Column({ type: 'uuid' })
  assetId!: string;

  @ColumnIndex('IDX_assets_audit_owner_id')
  @Column({ type: 'uuid' })
  ownerId!: string;

  @ColumnIndex('IDX_assets_audit_deleted_at')
  @CreateDateColumn({ default: () => 'clock_timestamp()' })
  deletedAt!: Date;
}
