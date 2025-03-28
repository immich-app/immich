import {
  Check,
  Column,
  ColumnIndex,
  CreateDateColumn,
  ForeignKeyColumn,
  Index,
  PrimaryGeneratedColumn,
  Table,
  UpdateDateColumn,
  UpdateIdColumn,
} from 'src/sql-tools';
import { AlbumTable } from 'src/tables/album.table';
import { AssetTable } from 'src/tables/asset.table';
import { UserTable } from 'src/tables/user.table';

@Table('activity')
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
export class ActivityTable {
  @PrimaryGeneratedColumn()
  id!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ColumnIndex('IDX_activity_update_id')
  @UpdateIdColumn()
  updateId!: string;

  @Column({ type: 'text', default: null })
  comment!: string | null;

  @Column({ type: 'boolean', default: false })
  isLiked!: boolean;

  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: true })
  assetId!: string | null;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  userId!: string;

  @ForeignKeyColumn(() => AlbumTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  albumId!: string;
}
