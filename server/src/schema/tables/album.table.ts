import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { AssetOrder } from 'src/enum';
import { AssetTable } from 'src/schema/tables/asset.table';
import { UserTable } from 'src/schema/tables/user.table';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ForeignKeyColumn,
  PrimaryGeneratedColumn,
  Table,
  UpdateDateColumn,
} from 'src/sql-tools';

@Table({ name: 'albums', primaryConstraintName: 'PK_7f71c7b5bc7c87b8f94c9a93a00' })
@UpdatedAtTrigger('albums_updated_at')
export class AlbumTable {
  @PrimaryGeneratedColumn()
  id!: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  ownerId!: string;

  @Column({ default: 'Untitled Album' })
  albumName!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ForeignKeyColumn(() => AssetTable, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    comment: 'Asset ID to be used as thumbnail',
  })
  albumThumbnailAssetId!: string;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'text', default: '' })
  description!: string;

  @DeleteDateColumn()
  deletedAt!: Date | null;

  @Column({ type: 'boolean', default: true })
  isActivityEnabled!: boolean;

  @Column({ default: AssetOrder.DESC })
  order!: AssetOrder;

  @UpdateIdColumn({ indexName: 'IDX_albums_update_id' })
  updateId?: string;
}
