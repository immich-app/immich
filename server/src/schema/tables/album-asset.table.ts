import { AlbumTable } from 'src/schema/tables/album.table';
import { AssetTable } from 'src/schema/tables/asset.table';
import { ColumnIndex, CreateDateColumn, ForeignKeyColumn, Table } from 'src/sql-tools';

@Table({ name: 'albums_assets_assets', primaryConstraintName: 'PK_c67bc36fa845fb7b18e0e398180' })
export class AlbumAssetTable {
  @ForeignKeyColumn(() => AlbumTable, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
    primary: true,
  })
  @ColumnIndex()
  albumsId!: string;

  @ForeignKeyColumn(() => AssetTable, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
    primary: true,
  })
  @ColumnIndex()
  assetsId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
