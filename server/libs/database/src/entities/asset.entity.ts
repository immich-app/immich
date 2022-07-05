import { Column, Entity, OneToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ExifEntity } from './exif.entity';
import { SmartInfoEntity } from './smart-info.entity';

@Entity('assets')
@Unique(['deviceAssetId', 'userId', 'deviceId'])
export class AssetEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  deviceAssetId!: string;

  @Column()
  userId!: string;

  @Column()
  deviceId!: string;

  @Column()
  type!: AssetType;

  @Column()
  originalPath!: string;

  @Column({ type: 'varchar', nullable: true })
  resizePath!: string | null;

  @Column({ type: 'varchar', nullable: true, default: '' })
  webpPath!: string | null;

  @Column({ type: 'varchar', nullable: true, default: '' })
  encodedVideoPath!: string;

  @Column()
  createdAt!: string;

  @Column()
  modifiedAt!: string;

  @Column({ type: 'boolean', default: false })
  isFavorite!: boolean;

  @Column({ type: 'varchar', nullable: true })
  mimeType!: string | null;

  @Column({ type: 'varchar', nullable: true })
  duration!: string | null;

  @OneToOne(() => ExifEntity, (exifEntity) => exifEntity.asset)
  exifInfo?: ExifEntity;

  @OneToOne(() => SmartInfoEntity, (smartInfoEntity) => smartInfoEntity.asset)
  smartInfo?: SmartInfoEntity;
}

export enum AssetType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  OTHER = 'OTHER',
}
