import { AlbumEntity } from 'src/entities/album.entity';
import { UserEntity } from 'src/entities/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

export enum AlbumUserRole {
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

@Entity('albums_shared_users_users')
// Pre-existing indices from original album <--> user ManyToMany mapping
@Index('IDX_427c350ad49bd3935a50baab73', ['album'])
@Index('IDX_f48513bf9bccefd6ff3ad30bd0', ['user'])
export class AlbumUserEntity {
  @PrimaryColumn({ type: 'uuid', name: 'albumsId' })
  albumId!: string;

  @PrimaryColumn({ type: 'uuid', name: 'usersId' })
  userId!: string;

  @JoinColumn({ name: 'albumsId' })
  @ManyToOne(() => AlbumEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  album!: AlbumEntity;

  @JoinColumn({ name: 'usersId' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  user!: UserEntity;

  @Column({ type: 'varchar', default: AlbumUserRole.EDITOR })
  role!: AlbumUserRole;
}
