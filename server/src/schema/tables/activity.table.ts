import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { AlbumAssetTable } from 'src/schema/tables/album-asset.table';
import { AlbumTable } from 'src/schema/tables/album.table';
import { AssetTable } from 'src/schema/tables/asset.table';
import { UserTable } from 'src/schema/tables/user.table';
import {
  Check,
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  ForeignKeyConstraint,
  Generated,
  Index,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from 'src/sql-tools';

@Table('activity')
@UpdatedAtTrigger('activity_updated_at')
@Index({
  name: 'IDX_activity_like',
  columns: ['assetId', 'userId', 'albumId'],
  unique: true,
  where: '("isLiked" = true)',
})
@Check({
  name: 'CHK_2ab1e70f113f450eb40c1e3ec8',
  expression: `("comment" IS NULL AND "isLiked" = true) OR ("comment" IS NOT NULL AND "isLiked" = false)`,
})
@ForeignKeyConstraint({
  name: 'fk_activity_album_asset_composite',
  columns: ['albumId', 'assetId'],
  referenceTable: () => AlbumAssetTable,
  referenceColumns: ['albumsId', 'assetsId'],
  onUpdate: 'NO ACTION',
  onDelete: 'CASCADE',
})
export class ActivityTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @ForeignKeyColumn(() => AlbumTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  albumId!: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  userId!: string;

  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: true })
  assetId!: string | null;

  @Column({ type: 'text', default: null })
  comment!: string | null;

  @Column({ type: 'boolean', default: false })
  isLiked!: Generated<boolean>;

  @UpdateIdColumn({ indexName: 'IDX_activity_update_id' })
  updateId!: Generated<string>;
}
