import { InjectQueue } from '@nestjs/bull';
import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { Queue } from 'bull';
import { randomUUID } from 'node:crypto';
import { imageClassificationQueueName, objectDetectionQueueName } from './constants/queue-name.constant';
import { OnAssetCreationDto } from './dto/on-asset-creation.dto';
import { ImageClassificationJob, ObjectDetectionJob } from './interfaces';

@Controller()
export class AppController {
  constructor(
    @InjectQueue(imageClassificationQueueName)
    private imageClassificationQueue: Queue<ImageClassificationJob>,

    @InjectQueue(objectDetectionQueueName)
    private objectDetectionQueue: Queue<ObjectDetectionJob>,
  ) {}

  @EventPattern('asset.created')
  async onAssetCreation(asset: OnAssetCreationDto) {
    await this.imageClassificationQueue.add(asset, { jobId: randomUUID() });
    await this.objectDetectionQueue.add(asset, { jobId: randomUUID() });
  }
}
