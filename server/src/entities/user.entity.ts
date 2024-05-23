import { AssetEntity } from 'src/entities/asset.entity';
import { TagEntity } from 'src/entities/tag.entity';
import { UserMetadataEntity } from 'src/entities/user-metadata.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserStatus {
  ACTIVE = 'active',
  REMOVING = 'removing',
  DELETED = 'deleted',
}

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ default: '' })
  name!: string;

  @Column({ default: false })
  isAdmin!: boolean;

  @Column({ unique: true })
  email!: string;

  @Column({ type: 'varchar', unique: true, default: null })
  storageLabel!: string | null;

  @Column({ default: '', select: false })
  password?: string;

  @Column({ default: '' })
  oauthId!: string;

  @Column({ default: '' })
  profileImagePath!: string;

  @Column({ default: true })
  shouldChangePassword!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt!: Date | null;

  @Column({ type: 'varchar', default: UserStatus.ACTIVE })
  status!: UserStatus;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => TagEntity, (tag) => tag.user)
  tags!: TagEntity[];

  @OneToMany(() => AssetEntity, (asset) => asset.owner)
  assets!: AssetEntity[];

  @Column({ type: 'bigint', nullable: true })
  quotaSizeInBytes!: number | null;

  @Column({ type: 'bigint', default: 0 })
  quotaUsageInBytes!: number;

  @OneToMany(() => UserMetadataEntity, (metadata) => metadata.user)
  metadata!: UserMetadataEntity[];
}
