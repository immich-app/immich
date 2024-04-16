import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AlbumUserEntity } from 'src/entities/album-user.entity';
import { AlbumPermissionId, IAlbumUserRepository } from 'src/interfaces/album-user.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { Repository } from 'typeorm';

@Instrumentation()
@Injectable()
export class AlbumUserRepository implements IAlbumUserRepository {
  constructor(@InjectRepository(AlbumUserEntity) private repository: Repository<AlbumUserEntity>) {}

  async create(dto: Partial<AlbumUserEntity>): Promise<AlbumUserEntity> {
    const { user, album } = await this.repository.save(dto);
    return this.repository.findOneOrFail({ where: { user, album }, relations: { user: true } });
  }

  async update({ userId, albumId }: AlbumPermissionId, dto: Partial<AlbumUserEntity>): Promise<AlbumUserEntity> {
    await this.repository.update({ user: { id: userId }, album: { id: albumId } }, dto);
    return this.repository.findOneOrFail({
      where: { user: { id: userId }, album: { id: albumId } },
      relations: { user: true },
    });
  }

  async delete({ userId, albumId }: AlbumPermissionId): Promise<void> {
    await this.repository.delete({ user: { id: userId }, album: { id: albumId } });
  }
}
