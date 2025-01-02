import { Generated, NonAttribute } from 'kysely-typeorm';
import { AssetEntity } from 'src/entities/asset.entity';
import { TagEntity } from 'src/entities/tag.entity';
import { UserMetadataEntity } from 'src/entities/user-metadata.entity';
import { UserStatus } from 'src/enum';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @Column({ default: '' })
  name!: Generated<string>;

  @Column({ default: false })
  isAdmin!: Generated<boolean>;

  @Column({ unique: true })
  email!: string;

  @Column({ type: 'varchar', unique: true, default: null })
  storageLabel!: Generated<string> | null;

  @Column({ default: '', select: false })
  password?: Generated<string>;

  @Column({ default: '' })
  oauthId!: Generated<string>;

  @Column({ default: '' })
  profileImagePath!: Generated<string>;

  @Column({ default: true })
  shouldChangePassword!: Generated<boolean>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Generated<Date>;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt!: Date | null;

  @Column({ type: 'varchar', default: UserStatus.ACTIVE })
  status!: Generated<UserStatus>;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Generated<Date>;

  @OneToMany(() => TagEntity, (tag) => tag.user)
  tags!: NonAttribute<TagEntity[]>;

  @OneToMany(() => AssetEntity, (asset) => asset.owner)
  assets!: NonAttribute<AssetEntity[]>;

  @Column({ type: 'bigint', nullable: true })
  quotaSizeInBytes!: number | null;

  @Column({ type: 'bigint', default: 0 })
  quotaUsageInBytes!: Generated<number>;

  @OneToMany(() => UserMetadataEntity, (metadata) => metadata.user)
  metadata!: NonAttribute<UserMetadataEntity[]>;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  profileChangedAt!: Generated<Date>;
}
