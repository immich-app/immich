import { AlbumEntity } from 'src/entities/album.entity';
import { UserEntity } from 'src/entities/user.entity';
import { AlbumUserRole } from 'src/enum';

export class AlbumUserEntity {
  albumId!: string;
  userId!: string;
  album!: AlbumEntity;
  user!: UserEntity;
  role!: AlbumUserRole;
}
