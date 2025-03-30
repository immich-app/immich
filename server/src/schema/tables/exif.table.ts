import { AssetTable } from 'src/schema/tables/asset.table';
import { Column, ColumnIndex, ForeignKeyColumn, Table, UpdateDateColumn, UpdateIdColumn } from 'src/sql-tools';

@Table('exif')
export class ExifTable {
  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', primary: true })
  assetId!: string;

  @UpdateDateColumn({ default: () => 'clock_timestamp()' })
  updatedAt?: Date;

  @ColumnIndex('IDX_asset_exif_update_id')
  @UpdateIdColumn()
  updateId?: string;

  /* General info */
  @Column({ type: 'text', default: '' })
  description!: string; // or caption

  @Column({ type: 'integer', nullable: true })
  exifImageWidth!: number | null;

  @Column({ type: 'integer', nullable: true })
  exifImageHeight!: number | null;

  @Column({ type: 'bigint', nullable: true })
  fileSizeInByte!: number | null;

  @Column({ type: 'character varying', nullable: true })
  orientation!: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  dateTimeOriginal!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  modifyDate!: Date | null;

  @Column({ type: 'character varying', nullable: true })
  timeZone!: string | null;

  @Column({ type: 'double precision', nullable: true })
  latitude!: number | null;

  @Column({ type: 'double precision', nullable: true })
  longitude!: number | null;

  @Column({ type: 'character varying', nullable: true })
  projectionType!: string | null;

  @ColumnIndex('exif_city')
  @Column({ type: 'character varying', nullable: true })
  city!: string | null;

  @ColumnIndex('IDX_live_photo_cid')
  @Column({ type: 'character varying', nullable: true })
  livePhotoCID!: string | null;

  @ColumnIndex('IDX_auto_stack_id')
  @Column({ type: 'character varying', nullable: true })
  autoStackId!: string | null;

  @Column({ type: 'character varying', nullable: true })
  state!: string | null;

  @Column({ type: 'character varying', nullable: true })
  country!: string | null;

  /* Image info */
  @Column({ type: 'character varying', nullable: true })
  make!: string | null;

  @Column({ type: 'character varying', nullable: true })
  model!: string | null;

  @Column({ type: 'character varying', nullable: true })
  lensModel!: string | null;

  @Column({ type: 'double precision', nullable: true })
  fNumber!: number | null;

  @Column({ type: 'double precision', nullable: true })
  focalLength!: number | null;

  @Column({ type: 'integer', nullable: true })
  iso!: number | null;

  @Column({ type: 'character varying', nullable: true })
  exposureTime!: string | null;

  @Column({ type: 'character varying', nullable: true })
  profileDescription!: string | null;

  @Column({ type: 'character varying', nullable: true })
  colorspace!: string | null;

  @Column({ type: 'integer', nullable: true })
  bitsPerSample!: number | null;

  @Column({ type: 'integer', nullable: true })
  rating!: number | null;

  /* Video info */
  @Column({ type: 'double precision', nullable: true })
  fps?: number | null;
}
