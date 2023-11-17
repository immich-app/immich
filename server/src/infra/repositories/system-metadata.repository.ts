import { ISystemMetadataRepository } from '@app/domain/repositories/system-metadata.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Metadata, SystemMetadataEntity } from '../entities';

export class SystemMetadataRepository implements ISystemMetadataRepository {
  constructor(
    @InjectRepository(SystemMetadataEntity)
    private repository: Repository<SystemMetadataEntity>,
  ) {}
  async get<T extends keyof Metadata>(key: T): Promise<Metadata[T] | null> {
    const metadata = await this.repository.findOne({ where: { key } });
    if (!metadata) return null;
    return metadata.value as Metadata[T];
  }

  async set<T extends keyof Metadata>(key: T, value: Metadata[T]): Promise<void> {
    await this.repository.upsert({ key, value }, { conflictPaths: { key: true } });
  }
}
