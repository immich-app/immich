import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ExifEntity } from './exif.entity';
import { SmartInfoEntity } from './smart-info.entity';

@Entity('assets')
@Unique(['deviceAssetId', 'userId', 'deviceId'])
export class AssetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  deviceAssetId: string;

  @Column()
  userId: string;

  @Column()
  deviceId: string;

  @Column()
  type: AssetType;

  @Column()
  originalPath: string;

  @Column({ nullable: true })
  resizePath: string;

  @Column()
  createdAt: string;

  @Column()
  modifiedAt: string;

  @Column({ type: 'boolean', default: false })
  isFavorite: boolean;

  @Column({ nullable: true })
  mimeType: string;

  @Column({ nullable: true })
  duration: string;

  @OneToOne(() => ExifEntity, (exifEntity) => exifEntity.asset)
  exifInfo: ExifEntity;

  @OneToOne(() => SmartInfoEntity, (smartInfoEntity) => smartInfoEntity.asset)
  smartInfo: SmartInfoEntity;
}

export enum AssetType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  OTHER = 'OTHER',
}
