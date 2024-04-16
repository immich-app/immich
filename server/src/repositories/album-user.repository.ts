import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AlbumUserEntity } from 'src/entities/album-user.entity';
import { AlbumPermissionId, IAlbumUserRepository } from 'src/interfaces/album-user.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { Equal, Repository } from 'typeorm';

@Instrumentation()
@Injectable()
export class AlbumUserRepository implements IAlbumUserRepository {
  constructor(@InjectRepository(AlbumUserEntity) private repository: Repository<AlbumUserEntity>) {}

  async create(dto: Partial<AlbumUserEntity>): Promise<AlbumUserEntity> {
    const { users, albums } = await this.repository.save(dto);
    return this.repository.findOneOrFail({ where: { users, albums }, relations: { users: true } });
  }

  async update({ userId, albumId }: AlbumPermissionId, dto: Partial<AlbumUserEntity>): Promise<AlbumUserEntity> {
    // @ts-expect-error I'm pretty sure I messed something up with the entity because
    // if I follow what typescript says I get postgres errors
    await this.repository.update({ users: userId, albums: albumId }, dto);
    return this.repository.findOneOrFail({
      where: { users: Equal(userId), albums: Equal(albumId) },
      relations: { users: true },
    });
  }

  async delete({ userId, albumId }: AlbumPermissionId): Promise<void> {
    await this.repository.delete({ users: { id: userId }, albums: { id: albumId } });
  }
}
