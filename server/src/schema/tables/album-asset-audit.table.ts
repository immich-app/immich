import { PrimaryGeneratedUuidV7Column } from 'src/decorators';
import { AlbumTable } from 'src/schema/tables/album.table';
import { Column, CreateDateColumn, ForeignKeyColumn, Generated, Table, Timestamp } from 'src/sql-tools';

@Table('album_assets_audit')
export class AlbumAssetAuditTable {
  @PrimaryGeneratedUuidV7Column()
  id!: Generated<string>;

  @ForeignKeyColumn(() => AlbumTable, {
    type: 'uuid',
    indexName: 'IDX_album_assets_audit_album_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  albumId!: string;

  @Column({ type: 'uuid', indexName: 'IDX_album_assets_audit_asset_id' })
  assetId!: string;

  @CreateDateColumn({ default: () => 'clock_timestamp()', indexName: 'IDX_album_assets_audit_deleted_at' })
  deletedAt!: Generated<Timestamp>;
}
