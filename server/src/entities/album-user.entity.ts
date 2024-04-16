import { AlbumEntity } from 'src/entities/album.entity';
import { UserEntity } from 'src/entities/user.entity';
import { Column, Entity, Index, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity('albums_shared_users_users')
// Indices for JoinTable
@Index('IDX_427c350ad49bd3935a50baab73', ['albums'])
@Index('IDX_f48513bf9bccefd6ff3ad30bd0', ['users'])
export class AlbumUserEntity {
  @PrimaryColumn({ type: 'uuid', name: 'albumsId' })
  @ManyToOne(() => AlbumEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  albums!: AlbumEntity;

  @PrimaryColumn({ type: 'uuid', name: 'usersId' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  users!: UserEntity;

  @Column({ default: true })
  readonly!: boolean;
}
