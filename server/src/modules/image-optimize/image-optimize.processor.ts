import { Processor } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetEntity } from '../../api-v1/asset/entities/asset.entity';
import { CommunicationGateway } from '../../api-v1/communication/communication.gateway';
import { BackgroundTaskService } from '../background-task/background-task.service';

@Processor('optimize')
export class ImageOptimizeProcessor {
  constructor(
    private wsCommunicateionGateway: CommunicationGateway,
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,

    private backgroundTaskService: BackgroundTaskService,
  ) {}
}
