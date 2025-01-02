import type { Generated, NonAttribute } from 'kysely-typeorm';
import { AlbumEntity } from 'src/entities/album.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import { UserEntity } from 'src/entities/user.entity';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('activity')
@Index('IDX_activity_like', ['assetId', 'userId', 'albumId'], { unique: true, where: '("isLiked" = true)' })
@Check(`("comment" IS NULL AND "isLiked" = true) OR ("comment" IS NOT NULL AND "isLiked" = false)`)
export class ActivityEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Generated<Date>;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Generated<Date>;

  @Column()
  albumId!: string;

  @Column()
  userId!: string;

  @Column({ nullable: true, type: 'uuid' })
  assetId!: string | null;

  @Column({ type: 'text', default: null })
  comment!: Generated<string> | null;

  @Column({ type: 'boolean', default: false })
  isLiked!: Generated<boolean>;

  @ManyToOne(() => AssetEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: true })
  asset!: NonAttribute<AssetEntity | null>;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  user!: NonAttribute<UserEntity>;

  @ManyToOne(() => AlbumEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  album!: NonAttribute<AlbumEntity>;
}
