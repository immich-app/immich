import { PrimaryGeneratedUuidV7Column } from 'src/decorators';
import { AlbumTable } from 'src/schema/tables/album.table';
import { Column, CreateDateColumn, ForeignKeyColumn, Generated, Table, Timestamp } from 'src/sql-tools';

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
