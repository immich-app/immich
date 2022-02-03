import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn, Unique } from 'typeorm';

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
  description: string;

  @Column({ nullable: true })
  lat: string;

  @Column({ nullable: true })
  lon: string;

  @Column({ nullable: true })
  mimeType: string;
}

export enum AssetType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  OTHER = 'OTHER',
}
