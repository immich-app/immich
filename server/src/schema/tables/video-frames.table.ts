import { Column, CreateDateColumn, ForeignKeyColumn, Generated, Table, Timestamp } from '@immich/sql-tools';
import { AssetTable } from 'src/schema/tables/asset.table';

@Table('video_frames')
export class VideoFramesTable {
  @ForeignKeyColumn(() => AssetTable, {
    onDelete: 'CASCADE',
    primary: true,
  })
  assetId!: string;

  @Column({ type: 'bigint', array: true })
  byteOffset!: number[];

  @Column({ type: 'integer', array: true })
  byteSize!: number[];

  // Mean absolute frame difference (mafd) score for this frame
  @Column({ type: 'real', array: true })
  intervalChange!: number[];

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;
}
