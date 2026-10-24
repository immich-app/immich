import { ForeignKeyColumn, Table } from '@immich/sql-tools';
import { AssetTable } from 'src/schema/tables/asset.table.js';
import { LockedAlbumTable } from 'src/schema/tables/locked-album.table.js';

@Table('locked_album_asset')
export class LockedAlbumAssetTable {
  @ForeignKeyColumn(() => LockedAlbumTable, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
    primary: true,
  })
  albumId!: string;

  @ForeignKeyColumn(() => AssetTable, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
    primary: true,
    index: true,
  })
  assetId!: string;
}
