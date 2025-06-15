import { PrimaryGeneratedUuidV7Column } from 'src/decorators';
import { Column, CreateDateColumn, Table } from 'src/sql-tools';

@Table('album_assets_assets_audit')
export class AlbumAssetAuditTable {
  @PrimaryGeneratedUuidV7Column()
  id!: string;

  @Column({ type: 'uuid', indexName: 'IDX_album_assets_assets_audit_album_id' })
  albumId!: string;

  @Column({ type: 'uuid', indexName: 'IDX_album_assets_assets_audit_asset_id' })
  assetId!: string;

  @CreateDateColumn({ default: () => 'clock_timestamp()', indexName: 'IDX_album_assets_assets_audit_deleted_at' })
  deletedAt!: Date;
}
