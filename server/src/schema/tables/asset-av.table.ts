import { Column, ForeignKeyColumn, Table } from '@immich/sql-tools';
import { AssetTable } from 'src/schema/tables/asset.table';

@Table('asset_audio')
export class AssetAudioTable {
  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', primary: true })
  assetId!: string;

  @Column({ type: 'integer' })
  bitrate!: number;

  @Column({ type: 'smallint' })
  index!: number;

  @Column({ type: 'smallint', nullable: true })
  profile!: number | null;

  @Column({ type: 'text' })
  codecName!: string;
}

@Table('asset_video')
export class AssetVideoTable {
  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', primary: true })
  assetId!: string;

  @Column({ type: 'integer' })
  bitrate!: number;

  @Column({ type: 'integer' })
  frameCount!: number;

  @Column({ type: 'integer' })
  timeBase!: number;

  @Column({ type: 'smallint' })
  index!: number;

  @Column({ type: 'smallint', nullable: true })
  profile!: number | null;

  @Column({ type: 'smallint', nullable: true })
  level!: number | null;

  @Column({ type: 'smallint' })
  colorPrimaries!: number;

  @Column({ type: 'smallint' })
  colorTransfer!: number;

  @Column({ type: 'smallint' })
  colorMatrix!: number;

  @Column({ type: 'smallint', nullable: true })
  dvProfile!: number | null;

  @Column({ type: 'smallint', nullable: true })
  dvLevel!: number | null;

  @Column({ type: 'smallint', nullable: true })
  dvBlSignalCompatibilityId!: number | null;

  @Column({ type: 'text' })
  codecName!: string;

  @Column({ type: 'text' })
  formatName!: string;

  @Column({ type: 'text' })
  formatLongName!: string;

  @Column({ type: 'text' })
  pixelFormat!: string;
}

@Table('asset_keyframe')
export class AssetKeyframeTable {
  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', primary: true })
  assetId!: string;

  @Column({ type: 'integer', array: true })
  pts!: number[];

  @Column({ type: 'integer', array: true })
  accDuration!: number[];

  @Column({ type: 'integer', array: true })
  ownDuration!: number[];

  @Column({ type: 'integer' })
  totalDuration!: number;

  @Column({ type: 'integer' })
  packetCount!: number;

  @Column({ type: 'integer' })
  outputFrames!: number;
}
