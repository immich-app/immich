import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { randomUUID } from 'crypto';
import { AssetEntity } from '../../api-v1/asset/entities/asset.entity';

@Injectable()
export class AssetOptimizeService {
  constructor(@InjectQueue('optimize') private optimizeQueue: Queue) {}
}
