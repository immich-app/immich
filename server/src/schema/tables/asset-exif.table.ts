import { LockableProperty } from 'src/database';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { AssetTable } from 'src/schema/tables/asset.table';
import { Column, ForeignKeyColumn, Generated, Int8, Table, Timestamp, UpdateDateColumn } from 'src/sql-tools';

@Table('asset_exif')
@UpdatedAtTrigger('asset_exif_updatedAt')
export class AssetExifTable {
  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', primary: true })
  assetId!: string;

  @Column({ type: 'character varying', nullable: true })
  make!: string | null;

  @Column({ type: 'character varying', nullable: true })
  model!: string | null;

  @Column({ type: 'integer', nullable: true })
  exifImageWidth!: number | null;

  @Column({ type: 'integer', nullable: true })
  exifImageHeight!: number | null;

  @Column({ type: 'bigint', nullable: true })
  fileSizeInByte!: Int8 | null;

  @Column({ type: 'character varying', nullable: true })
  orientation!: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  dateTimeOriginal!: Timestamp | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  modifyDate!: Timestamp | null;

  @Column({ type: 'character varying', nullable: true })
  lensModel!: string | null;

  @Column({ type: 'double precision', nullable: true })
  fNumber!: number | null;

  @Column({ type: 'double precision', nullable: true })
  focalLength!: number | null;

  @Column({ type: 'integer', nullable: true })
  iso!: number | null;

  @Column({ type: 'double precision', nullable: true })
  latitude!: number | null;

  @Column({ type: 'double precision', nullable: true })
  longitude!: number | null;

  @Column({ type: 'character varying', nullable: true, index: true })
  city!: string | null;

  @Column({ type: 'character varying', nullable: true })
  state!: string | null;

  @Column({ type: 'character varying', nullable: true })
  country!: string | null;

  @Column({ type: 'text', default: '' })
  description!: Generated<string>; // or caption

  @Column({ type: 'double precision', nullable: true })
  fps!: number | null;

  @Column({ type: 'character varying', nullable: true })
  exposureTime!: string | null;

  @Column({ type: 'character varying', nullable: true, index: true })
  livePhotoCID!: string | null;

  @Column({ type: 'character varying', nullable: true })
  timeZone!: string | null;

  @Column({ type: 'character varying', nullable: true })
  projectionType!: string | null;

  @Column({ type: 'character varying', nullable: true })
  profileDescription!: string | null;

  @Column({ type: 'character varying', nullable: true })
  colorspace!: string | null;

  @Column({ type: 'integer', nullable: true })
  bitsPerSample!: number | null;

  @Column({ type: 'character varying', nullable: true, index: true })
  autoStackId!: string | null;

  @Column({ type: 'integer', nullable: true })
  rating!: number | null;

  @UpdateDateColumn({ default: () => 'clock_timestamp()' })
  updatedAt!: Generated<Date>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;

  @Column({ type: 'character varying', array: true, nullable: true })
  lockedProperties!: Array<LockableProperty> | null;
}
