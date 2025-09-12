import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { AssetTable } from 'src/schema/tables/asset.table';
import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  Unique,
  UpdateDateColumn,
} from 'src/sql-tools';
import { AudioStreamInfo, VideoStreamInfo } from 'src/types';

@Table('asset_vod_metadata')
@Unique({ columns: ['assetId'] })
@UpdatedAtTrigger('asset_file_updatedAt')
export class AssetVodMetadataTable implements VideoStreamInfo, AudioStreamInfo {
  index = 0;

  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  assetId!: string;

  @Column({ type: 'integer' })
  height!: number;
  @Column({ type: 'integer' })
  width!: number;

  @Column({ type: 'integer' })
  rotation!: number;

  @Column({ nullable: true })
  codecName?: string;

  @Column({ type: 'integer' })
  frameCount!: number;

  @Column({ type: 'boolean' })
  isHDR!: boolean;

  @Column({ type: 'integer' })
  bitrate!: number;

  @Column()
  pixelFormat!: string;

  @Column({ nullable: true })
  codecTag?: string;

  @Column({ nullable: true })
  profile?: string;

  @Column()
  fps!: number;

  @Column({ type: 'integer', nullable: true })
  level!: number;

  @Column({ nullable: true })
  audioCodecName?: string;

  @Column({ type: 'integer', nullable: true })
  audioBitrate?: number;

  @Column({ type: 'real', array: true })
  frames!: number[];

  @Column({ type: 'integer', array: true })
  keyframes!: number[];

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
