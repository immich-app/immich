import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AlbumEntity } from '.';
import { AssetEntity } from './asset.entity';
import { UserEntity } from './user.entity';

@Entity('activity')
export class ActivityEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: null })
  updatedAt!: Date | null;

  @Column()
  assetId!: string;

  @Column()
  userId!: string;

  @Column()
  albumId!: string;

  @Column({ type: 'text', default: null })
  comment!: string | null;

  @Column({ type: 'boolean', default: false })
  isFavorite!: boolean;

  @ManyToOne(() => AssetEntity, (asset) => asset.activity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  asset!: AssetEntity;

  @ManyToOne(() => UserEntity, (user) => user.activity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  user!: UserEntity;

  @ManyToOne(() => AlbumEntity, (album) => album.activity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  album!: AlbumEntity;
}
