import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AlbumEntity } from './album.entity';
import { UserEntity } from './user.entity';

@Entity('rules')
export class RuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  key!: RuleKey;

  @Column()
  value!: string;

  @Column()
  ownerId!: string;

  @ManyToOne(() => UserEntity)
  user!: UserEntity;

  @Column()
  albumId!: string;

  @ManyToOne(() => AlbumEntity, (album) => album.rules, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  album!: AlbumEntity;
}

export enum RuleKey {
  PERSON = 'personId',
  EXIF_CITY = 'exifInfo.city',
  DATE_AFTER = 'asset.fileCreatedAt',
}
