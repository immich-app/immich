import { ISmartInfoRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmartInfoEntity } from '../entities';

@Injectable()
export class SmartInfoRepository implements ISmartInfoRepository {
  constructor(@InjectRepository(SmartInfoEntity) private repository: Repository<SmartInfoEntity>) {}

  async upsert(info: Partial<SmartInfoEntity>): Promise<void> {
    await this.repository.upsert(info, { conflictPaths: ['assetId'] });
  }
}
