import { ISystemConfigRepository, SystemConfigDto } from '@app/domain';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { constants } from 'fs';
import fs from 'fs/promises';
import { DeepPartial, In, Repository } from 'typeorm';
import { SystemConfig, SystemConfigEntity } from '../entities';

export class SystemConfigRepository implements ISystemConfigRepository {
  constructor(
    @InjectRepository(SystemConfigEntity)
    private repository: Repository<SystemConfigEntity>,
  ) {}

  load(): Promise<SystemConfigEntity[]> {
    return this.repository.find();
  }

  async readConfigFile(): Promise<DeepPartial<SystemConfig>> {
    const path = process.env.CONFIG_FILE;
    if (!path) {
      throw new Error('Config file not set in env variable');
    }

    try {
      await fs.access(path, constants.R_OK);
    } catch (_) {
      throw new Error(`Couldn't read file ${path}`);
    }

    const config: DeepPartial<SystemConfig> = plainToClass(
      SystemConfigDto,
      JSON.parse(await fs.readFile(path, 'utf-8')),
    );

    const error = await validate(config, {
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      skipMissingProperties: true,
    });
    if (error.length > 0) {
      throw new Error(`Invalid value(s) in file: ${error}`);
    }

    return config;
  }

  saveAll(items: SystemConfigEntity[]): Promise<SystemConfigEntity[]> {
    return this.repository.save(items);
  }

  async deleteKeys(keys: string[]): Promise<void> {
    await this.repository.delete({ key: In(keys) });
  }
}
