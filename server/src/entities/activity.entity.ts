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
  id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

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

  @ManyToOne(() => AssetEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: true })
  asset!: AssetEntity | null;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  user!: UserEntity;

  @ManyToOne(() => AlbumEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  album!: AlbumEntity;
}
