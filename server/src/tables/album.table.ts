import { AssetOrder } from 'src/enum';
import {
  Column,
  ColumnIndex,
  CreateDateColumn,
  DeleteDateColumn,
  ForeignKeyColumn,
  PrimaryGeneratedColumn,
  Table,
  UpdateDateColumn,
  UpdateIdColumn,
} from 'src/sql-tools';
import { AssetTable } from 'src/tables/asset.table';
import { UserTable } from 'src/tables/user.table';

@Table({ name: 'albums', primaryConstraintName: 'PK_7f71c7b5bc7c87b8f94c9a93a00' })
export class AlbumTable {
  @PrimaryGeneratedColumn()
  id!: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  ownerId!: string;

  @Column({ default: 'Untitled Album' })
  albumName!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ColumnIndex('IDX_albums_update_id')
  @UpdateIdColumn()
  updateId?: string;

  @DeleteDateColumn()
  deletedAt!: Date | null;

  @ForeignKeyColumn(() => AssetTable, { nullable: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  albumThumbnailAssetId!: string;

  @Column({ type: 'boolean', default: true })
  isActivityEnabled!: boolean;

  @Column({ default: AssetOrder.DESC })
  order!: AssetOrder;
}
