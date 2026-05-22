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
} from '@immich/sql-tools';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { AlbumAssetTable } from 'src/schema/tables/album-asset.table';
import { AlbumTable } from 'src/schema/tables/album.table';
import { AssetTable } from 'src/schema/tables/asset.table';
import { UserTable } from 'src/schema/tables/user.table';

@Table('activity')
@UpdatedAtTrigger('activity_updatedAt')
@Index({
  name: 'activity_like_idx',
  columns: ['assetId', 'userId', 'albumId'],
  unique: true,
  where: '("isLiked" = true)',
})
@Check({
  name: 'activity_like_check',
  expression: `(comment IS NULL AND "isLiked" = true) OR (comment IS NOT NULL AND "isLiked" = false)`,
})
@ForeignKeyConstraint({
  columns: ['albumId', 'assetId'],
  referenceTable: () => AlbumAssetTable,
  referenceColumns: ['albumId', 'assetId'],
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

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
