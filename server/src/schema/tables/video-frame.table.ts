import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  Int8,
  PrimaryColumn,
  Table,
  Timestamp,
} from '@immich/sql-tools';
import { AssetTable } from 'src/schema/tables/asset.table';

@Table('video_frame')
export class VideoFrameTable {
  @ForeignKeyColumn(() => AssetTable, {
    onDelete: 'CASCADE',
    primary: true,
    index: false,
  })
  assetId!: string;

  @PrimaryColumn({ type: 'integer' })
  frameIndex!: number;

  @Column({ type: 'bigint' })
  byteOffset!: Int8;

  @Column({ type: 'integer' })
  byteSize!: number;

  // Mean absolute frame difference (mafd) score for this frame
  @Column({ type: 'real' })
  intervalChange!: number;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;
}
