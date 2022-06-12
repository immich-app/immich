import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { UserEntity } from './user.entity';
import { SharedAlbumEntity } from './shared-album.entity';

@Entity('user_shared_album')
@Unique('PK_unique_user_in_album', ['albumId', 'sharedUserId'])
export class UserSharedAlbumEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  albumId: string;

  @Column()
  sharedUserId: string;

  @ManyToOne(() => SharedAlbumEntity, (sharedAlbum) => sharedAlbum.sharedUsers, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'albumId' })
  albumInfo: SharedAlbumEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'sharedUserId' })
  userInfo: UserEntity;
}
