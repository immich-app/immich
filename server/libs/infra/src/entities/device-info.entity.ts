import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('device_info')
@Unique(['userId', 'deviceId'])
export class DeviceInfoEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: string;

  @Column()
  deviceId!: string;

  @Column()
  deviceType!: DeviceType;

  @Column({ type: 'varchar', nullable: true })
  notificationToken!: string | null;

  @CreateDateColumn()
  createdAt!: string;

  @Column({ type: 'bool', default: false })
  isAutoBackup!: boolean;
}

export enum DeviceType {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  WEB = 'WEB',
}
