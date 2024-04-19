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

  async create(albumUser: Partial<AlbumUserEntity>): Promise<AlbumUserEntity> {
    const { userId, albumId } = await this.repository.save(albumUser);
    return this.repository.findOneOrFail({ where: { userId, albumId } });
  }

  async update({ userId, albumId }: AlbumPermissionId, dto: Partial<AlbumUserEntity>): Promise<AlbumUserEntity> {
    await this.repository.update({ userId, albumId }, dto);
    return this.repository.findOneOrFail({
      where: { userId, albumId },
    });
  }

  async delete({ userId, albumId }: AlbumPermissionId): Promise<void> {
    await this.repository.delete({ userId, albumId });
  }
}
