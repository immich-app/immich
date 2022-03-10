import { Index, JoinColumn, OneToOne } from 'typeorm';
import { Column } from 'typeorm/decorator/columns/Column';
import { PrimaryGeneratedColumn } from 'typeorm/decorator/columns/PrimaryGeneratedColumn';
import { Entity } from 'typeorm/decorator/entity/Entity';
import { AssetEntity } from './asset.entity';

@Entity('exif')
export class ExifEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  assetId: string;

  @Column({ nullable: true })
  make: string;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true })
  imageName: string;

  @Column({ nullable: true })
  exifImageWidth: number;

  @Column({ nullable: true })
  exifImageHeight: number;

  @Column({ nullable: true })
  fileSizeInByte: number;

  @Column({ nullable: true })
  orientation: string;

  @Column({ type: 'timestamptz', nullable: true })
  dateTimeOriginal: Date;

  @Column({ type: 'timestamptz', nullable: true })
  modifyDate: Date;

  @Column({ nullable: true })
  lensModel: string;

  @Column({ type: 'float8', nullable: true })
  fNumber: number;

  @Column({ type: 'float8', nullable: true })
  focalLength: number;

  @Column({ nullable: true })
  iso: number;

  @Column({ type: 'float', nullable: true })
  exposureTime: number;

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  country: string;

  @OneToOne(() => AssetEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'assetId', referencedColumnName: 'id' })
  asset: ExifEntity;
}
