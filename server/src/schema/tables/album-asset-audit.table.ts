import { Column, CreateDateColumn, ForeignKeyColumn, type Generated, Table, Timestamp } from '@immich/sql-tools';
import { PrimaryGeneratedUuidV7Column } from 'src/decorators.js';
import { AlbumTable } from 'src/schema/tables/album.table.js';

@Table('album_asset_audit')
export class AlbumAssetAuditTable {
  @PrimaryGeneratedUuidV7Column()
  id!: Generated<string>;

  @ForeignKeyColumn(() => AlbumTable, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  albumId!: string;

  @Column({ type: 'uuid', index: true })
  assetId!: string;

  @CreateDateColumn({ default: () => 'clock_timestamp()', index: true })
  deletedAt!: Generated<Timestamp>;
}
