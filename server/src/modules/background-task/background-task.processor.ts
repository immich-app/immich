import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Job, Queue } from 'bull';
import { Repository } from 'typeorm';
import { AssetEntity } from '../../api-v1/asset/entities/asset.entity';
import { ConfigService } from '@nestjs/config';

@Processor('background-task')
export class ImageOptimizeProcessor {
  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,

    private configService: ConfigService,
  ) {}
}
