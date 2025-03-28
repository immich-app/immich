import { ColumnIndex, CreateDateColumn, ForeignKeyColumn, Table } from 'src/sql-tools';
import { AlbumTable } from 'src/tables/album.table';
import { AssetTable } from 'src/tables/asset.table';

@Table({ name: 'albums_assets_assets', primaryConstraintName: 'PK_c67bc36fa845fb7b18e0e398180' })
export class AlbumAssetTable {
  @ForeignKeyColumn(() => AssetTable, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
    primary: true,
  })
  @ColumnIndex()
  assetsId!: string;

  @ForeignKeyColumn(() => AlbumTable, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
    primary: true,
  })
  @ColumnIndex()
  albumsId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
