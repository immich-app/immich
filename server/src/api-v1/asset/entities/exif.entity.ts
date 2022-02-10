import { Index } from 'typeorm';
import { Column } from 'typeorm/decorator/columns/Column';
import { PrimaryGeneratedColumn } from 'typeorm/decorator/columns/PrimaryGeneratedColumn';
import { Entity } from 'typeorm/decorator/entity/Entity';

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
  modifiedDate: Date;

  @Column({ nullable: true })
  lensModel: string;

  @Column({ nullable: true })
  fNumber: number;

  @Column({ nullable: true })
  focalLenght: number;

  @Column({ nullable: true })
  iso: number;

  @Column({ nullable: true })
  exposureTime: number;
}
