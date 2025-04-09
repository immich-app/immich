import { User } from 'src/database';
import { AlbumEntity } from 'src/entities/album.entity';
import { AlbumUserRole } from 'src/enum';

export class AlbumUserEntity {
  albumId!: string;
  userId!: string;
  album!: AlbumEntity;
  user!: User;
  role!: AlbumUserRole;
}
