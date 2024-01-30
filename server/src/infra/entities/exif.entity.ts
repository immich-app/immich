import { Index, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Column } from 'typeorm/decorator/columns/Column.js';
import { Entity } from 'typeorm/decorator/entity/Entity.js';
import { AssetEntity } from './asset.entity';

@Entity('exif')
export class ExifEntity {
  @OneToOne(() => AssetEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn()
  asset?: AssetEntity;

  @PrimaryColumn()
  assetId!: string;

  /* General info */
  @Column({ type: 'text', default: '' })
  description!: string; // or caption

  @Column({ type: 'integer', nullable: true })
  exifImageWidth!: number | null;

  @Column({ type: 'integer', nullable: true })
  exifImageHeight!: number | null;

  @Column({ type: 'bigint', nullable: true })
  fileSizeInByte!: number | null;

  @Column({ type: 'varchar', nullable: true })
  orientation!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  dateTimeOriginal!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  modifyDate!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  timeZone!: string | null;

  @Column({ type: 'float', nullable: true })
  latitude!: number | null;

  @Column({ type: 'float', nullable: true })
  longitude!: number | null;

  @Column({ type: 'varchar', nullable: true })
  projectionType!: string | null;

  @Index('exif_city')
  @Column({ type: 'varchar', nullable: true })
  city!: string | null;

  @Index('IDX_live_photo_cid')
  @Column({ type: 'varchar', nullable: true })
  livePhotoCID!: string | null;

  @Index('IDX_auto_stack_id')
  @Column({ type: 'varchar', nullable: true })
  autoStackId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  state!: string | null;

  @Column({ type: 'varchar', nullable: true })
  country!: string | null;

  /* Image info */
  @Column({ type: 'varchar', nullable: true })
  make!: string | null;

  @Column({ type: 'varchar', nullable: true })
  model!: string | null;

  @Column({ type: 'varchar', nullable: true })
  lensModel!: string | null;

  @Column({ type: 'float8', nullable: true })
  fNumber!: number | null;

  @Column({ type: 'float8', nullable: true })
  focalLength!: number | null;

  @Column({ type: 'integer', nullable: true })
  iso!: number | null;

  @Column({ type: 'varchar', nullable: true })
  exposureTime!: string | null;

  @Column({ type: 'varchar', nullable: true })
  profileDescription!: string | null;

  @Column({ type: 'varchar', nullable: true })
  colorspace!: string | null;

  @Column({ type: 'integer', nullable: true })
  bitsPerSample!: number | null;

  /* Video info */
  @Column({ type: 'float8', nullable: true })
  fps?: number | null;

  @Index('exif_text_searchable', { synchronize: false })
  @Column({
    type: 'tsvector',
    generatedType: 'STORED',
    select: false,
    asExpression: `TO_TSVECTOR('english',
                         COALESCE(make, '') || ' ' ||
                         COALESCE(model, '') || ' ' ||
                         COALESCE(orientation, '') || ' ' ||
                         COALESCE("lensModel", '') || ' ' ||
                         COALESCE("city", '') || ' ' ||
                         COALESCE("state", '') || ' ' ||
                         COALESCE("country", ''))`,
  })
  exifTextSearchableColumn!: string;
}
