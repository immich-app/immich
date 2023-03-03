import { IAlbumRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlbumEntity } from '../entities';

@Injectable()
export class AlbumRepository implements IAlbumRepository {
  constructor(@InjectRepository(AlbumEntity) private repository: Repository<AlbumEntity>) {}

  async deleteAll(userId: string): Promise<void> {
    await this.repository.delete({ ownerId: userId });
  }

  getAll(): Promise<AlbumEntity[]> {
    return this.repository.find();
  }

  async save(album: Partial<AlbumEntity>) {
    const { id } = await this.repository.save(album);
    return this.repository.findOneOrFail({ where: { id } });
  }
}
