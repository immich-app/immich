import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VersionHistoryEntity } from 'src/entities/version-history.entity';
import { IVersionHistoryRepository } from 'src/interfaces/version-history.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { Repository } from 'typeorm';

@Instrumentation()
@Injectable()
export class VersionHistoryRepository implements IVersionHistoryRepository {
  constructor(@InjectRepository(VersionHistoryEntity) private repository: Repository<VersionHistoryEntity>) {}

  async getAll(): Promise<VersionHistoryEntity[]> {
    return this.repository.find({ order: { createdAt: 'DESC' } });
  }

  async getLatest(): Promise<VersionHistoryEntity | null> {
    const results = await this.repository.find({ order: { createdAt: 'DESC' }, take: 1 });
    return results[0] || null;
  }

  create(version: Omit<VersionHistoryEntity, 'id' | 'createdAt'>): Promise<VersionHistoryEntity> {
    return this.repository.save(version);
  }
}
