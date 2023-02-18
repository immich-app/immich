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
}
