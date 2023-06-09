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

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ default: '' })
  firstName!: string;

  @Column({ default: '' })
  lastName!: string;

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

  @OneToMany(() => TagEntity, (tag) => tag.user)
  tags!: TagEntity[];

  @OneToMany(() => AssetEntity, (asset) => asset.owner)
  assets!: AssetEntity[];
}
