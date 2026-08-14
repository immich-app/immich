import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  Index,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
} from '@immich/sql-tools';
import { VideoSegmentCodec } from 'src/enum';
import { video_stream_variant_codec_enum } from 'src/schema/enums';
import { AssetTable } from 'src/schema/tables/asset.table';

@Table('video_stream_session')
export class VideoStreamSessionTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE' })
  assetId!: string;

  @Column({ type: 'timestamp with time zone', index: true })
  expiresAt!: Timestamp;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;
}

@Index({ columns: ['sessionId', 'bitrate', 'resolution', 'codec'], unique: true })
@Table('video_stream_variant')
export class VideoStreamVariantTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => VideoStreamSessionTable, { onDelete: 'CASCADE', index: false })
  sessionId!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @Column({ type: 'integer' })
  bitrate!: number;

  @Column({ enum: video_stream_variant_codec_enum })
  codec!: VideoSegmentCodec;

  @Column({ type: 'smallint' })
  resolution!: number;
}

@Table('video_stream_segment')
export class VideoStreamSegmentTable {
  @ForeignKeyColumn(() => VideoStreamVariantTable, { onDelete: 'CASCADE', primary: true, index: false })
  variantId!: string;

  @PrimaryColumn({ type: 'integer' })
  index!: number;

  @Column({ type: 'integer' })
  durationUs!: number;
}
