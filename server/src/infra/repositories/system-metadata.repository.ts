import { ISystemMetadataRepository } from '@app/domain/repositories/system-metadata.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemMetadata, SystemMetadataEntity } from '../entities';
import { Span } from 'nestjs-otel';

export class SystemMetadataRepository implements ISystemMetadataRepository {
  constructor(
    @InjectRepository(SystemMetadataEntity)
    private repository: Repository<SystemMetadataEntity>,
  ) {}

  @Span()
  async get<T extends keyof SystemMetadata>(key: T): Promise<SystemMetadata[T] | null> {
    const metadata = await this.repository.findOne({ where: { key } });
    if (!metadata) {
      return null;
    }
    return metadata.value as SystemMetadata[T];
  }

  @Span()
  async set<T extends keyof SystemMetadata>(key: T, value: SystemMetadata[T]): Promise<void> {
    await this.repository.upsert({ key, value }, { conflictPaths: { key: true } });
  }
}
