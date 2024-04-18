import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SystemMetadata, SystemMetadataEntity } from 'src/entities/system-metadata.entity';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { Repository } from 'typeorm';

@Instrumentation()
@Injectable()
export class SystemMetadataRepository implements ISystemMetadataRepository {
  constructor(
    @InjectRepository(SystemMetadataEntity)
    private repository: Repository<SystemMetadataEntity>,
  ) {}

  async get<T extends keyof SystemMetadata>(key: T): Promise<SystemMetadata[T] | null> {
    const metadata = await this.repository.findOne({ where: { key } });
    if (!metadata) {
      return null;
    }
    return metadata.value as SystemMetadata[T];
  }

  async set<T extends keyof SystemMetadata>(key: T, value: SystemMetadata[T]): Promise<void> {
    await this.repository.upsert({ key, value }, { conflictPaths: { key: true } });
  }
}
