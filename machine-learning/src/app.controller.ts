import { InjectQueue } from '@nestjs/bull';
import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { Queue } from 'bull';
import { imageClassificationQueueName, objectDetectionQueueName } from './constants/queue-name.constant';
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
  async onAssetCreation(mediaMsg: any) {

  }
}
