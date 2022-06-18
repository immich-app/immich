import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { UserEntity } from './user.entity';
import { AlbumEntity } from './album.entity';

@Entity('user_shared_album')
@Unique('PK_unique_user_in_album', ['albumId', 'sharedUserId'])
export class UserAlbumEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  albumId: string;

  @Column()
  sharedUserId: string;

  @ManyToOne(() => AlbumEntity, (album) => album.sharedUsers, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'albumId' })
  albumInfo: AlbumEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'sharedUserId' })
  userInfo: UserEntity;
}
