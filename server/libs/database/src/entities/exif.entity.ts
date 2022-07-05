import { Index, JoinColumn, OneToOne } from 'typeorm';
import { Column } from 'typeorm/decorator/columns/Column';
import { PrimaryGeneratedColumn } from 'typeorm/decorator/columns/PrimaryGeneratedColumn';
import { Entity } from 'typeorm/decorator/entity/Entity';
import { AssetEntity } from './asset.entity';

@Entity('exif')
export class ExifEntity {
  @PrimaryGeneratedColumn()
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  assetId!: string;

  @Column({ type: 'varchar', nullable: true })
  make!: string | null;

  @Column({ type: 'varchar', nullable: true })
  model!: string | null;

  @Column({ type: 'varchar', nullable: true })
  imageName!: string | null;

  @Column({ type: 'integer', nullable: true })
  exifImageWidth!: number | null;

  @Column({ type: 'integer', nullable: true })
  exifImageHeight!: number | null;

  @Column({ type: 'integer', nullable: true })
  fileSizeInByte!: number | null;

  @Column({ type: 'varchar', nullable: true })
  orientation!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  dateTimeOriginal!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  modifyDate!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  lensModel!: string | null;

  @Column({ type: 'float8', nullable: true })
  fNumber!: number | null;

  @Column({ type: 'float8', nullable: true })
  focalLength!: number | null;

  @Column({ type: 'integer', nullable: true })
  iso!: number | null;

  @Column({ type: 'float', nullable: true })
  exposureTime!: number | null;

  @Column({ type: 'float', nullable: true })
  latitude!: number | null;

  @Column({ type: 'float', nullable: true })
  longitude!: number | null;

  @Column({ type: 'varchar', nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', nullable: true })
  state!: string | null;

  @Column({ type: 'varchar', nullable: true })
  country!: string | null;

  @OneToOne(() => AssetEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'assetId', referencedColumnName: 'id' })
  asset?: ExifEntity;

  @Index("exif_text_searchable", { synchronize: false })
  @Column({
    type: 'tsvector',
    generatedType: 'STORED',
    asExpression: `TO_TSVECTOR('english',
                         COALESCE(make, '') || ' ' ||
                         COALESCE(model, '') || ' ' ||
                         COALESCE(orientation, '') || ' ' ||
                         COALESCE("lensModel", '') || ' ' ||
                         COALESCE("city", '') || ' ' ||
                         COALESCE("state", '') || ' ' ||
                         COALESCE("country", ''))`
  })
  exifTextSearchableColumn!: string
}
