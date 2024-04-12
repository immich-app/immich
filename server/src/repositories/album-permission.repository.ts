import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DummyValue, GenerateSql } from 'src/decorators';
import { AlbumPermissionEntity } from 'src/entities/album-permission.entity';
import { IAlbumPermissionRepository } from 'src/interfaces/album-permission.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { Repository } from 'typeorm';

@Instrumentation()
@Injectable()
export class AlbumPermissionRepository implements IAlbumPermissionRepository {
  constructor(@InjectRepository(AlbumPermissionEntity) private repository: Repository<AlbumPermissionEntity>) {}

  async create(dto: Partial<AlbumPermissionEntity>): Promise<AlbumPermissionEntity> {
    const { users, albums } = await this.repository.save(dto);
    return this.repository.findOneOrFail({ where: { users, albums }, relations: { users: true } });
  }

  async update(userId: string, albumId: string, dto: Partial<AlbumPermissionEntity>): Promise<AlbumPermissionEntity> {
    await this.repository.update({ users: { id: userId }, albums: { id: albumId } }, dto);
    return this.repository.findOneOrFail({
      where: { users: { id: userId }, albums: { id: albumId } },
      relations: { users: true },
    });
  }

  async delete(userId: string, albumId: string): Promise<void> {
    await this.repository.delete({ users: { id: userId }, albums: { id: albumId } });
  }
}
