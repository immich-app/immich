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
import { AlbumEntity } from '.';
import { AssetEntity } from './asset.entity';
import { UserEntity } from './user.entity';

@Entity('activity')
@Index('IDX_activity_like', ['assetId', 'userId', 'albumId'], { unique: true, where: '("isLiked" = true)' })
@Check(`("comment" IS NULL AND "isLiked" = true) OR ("comment" IS NOT NULL AND "isLiked" = false)`)
export class ActivityEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: null })
  updatedAt!: Date | null;

  @Column()
  albumId!: string;

  @Column()
  userId!: string;

  @Column({ nullable: true, type: 'uuid' })
  assetId!: string | null;

  @Column({ type: 'text', default: null })
  comment!: string | null;

  @Column({ type: 'boolean', default: false })
  isLiked!: boolean;

  @ManyToOne(() => AssetEntity, (asset) => asset.activity, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: true })
  asset!: AssetEntity | null;

  @ManyToOne(() => UserEntity, (user) => user.activity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  user!: UserEntity;

  @ManyToOne(() => AlbumEntity, (album) => album.activity, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: true })
  album!: AlbumEntity;
}
