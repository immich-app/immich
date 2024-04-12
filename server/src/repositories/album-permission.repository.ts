import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equals } from 'class-validator';
import { AlbumPermissionEntity } from 'src/entities/album-permission.entity';
import { IAlbumPermissionRepository } from 'src/interfaces/album-permission.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { Equal, Repository } from 'typeorm';

@Instrumentation()
@Injectable()
export class AlbumPermissionRepository implements IAlbumPermissionRepository {
  constructor(@InjectRepository(AlbumPermissionEntity) private repository: Repository<AlbumPermissionEntity>) {}

  async create(dto: Partial<AlbumPermissionEntity>): Promise<AlbumPermissionEntity> {
    const { users, albums } = await this.repository.save(dto);
    return this.repository.findOneOrFail({ where: { users, albums }, relations: { users: true } });
  }

  async update(userId: string, albumId: string, dto: Partial<AlbumPermissionEntity>): Promise<AlbumPermissionEntity> {
    // @ts-expect-error I'm pretty sure I messed something up with the entity because
    // if I follow what typescript says I get postgres errors
    await this.repository.update({ users: userId, albums: albumId }, dto);
    return this.repository.findOneOrFail({
      where: { users: Equal(userId), albums: Equal(albumId) },
      relations: { users: true },
    });
  }

  async delete(userId: string, albumId: string): Promise<void> {
    await this.repository.delete({ users: { id: userId }, albums: { id: albumId } });
  }
}
