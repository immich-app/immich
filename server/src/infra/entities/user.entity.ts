import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AssetEntity } from './asset.entity';
import { TagEntity } from './tag.entity';

export enum UserAvatarColor {
  PRIMARY = 'primary',
  PINK = 'pink',
  RED = 'red',
  YELLOW = 'yellow',
  BLUE = 'blue',
  GREEN = 'green',
  PURPLE = 'purple',
  ORANGE = 'orange',
  GRAY = 'gray',
  AMBER = 'amber',
}

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ default: '' })
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  avatarColor!: UserAvatarColor | null;

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

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ default: true })
  memoriesEnabled!: boolean;

  @OneToMany(() => TagEntity, (tag) => tag.user)
  tags!: TagEntity[];

  @OneToMany(() => AssetEntity, (asset) => asset.owner)
  assets!: AssetEntity[];

  @Column({ type: 'bigint', nullable: true })
  quotaSizeInBytes!: number | null;

  @Column({ type: 'bigint', default: 0 })
  quotaUsageInBytes!: number;
}
