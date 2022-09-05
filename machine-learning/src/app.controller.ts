import { InjectQueue } from '@nestjs/bull';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Queue } from 'bull';
import { randomUUID } from 'node:crypto';
import { imageClassificationQueueName, objectDetectionQueueName } from './constants/queue-name.constant';
import { WebhookEventTypes, WebhookPayloadDto } from './dto/webhook-payload.dto';
import { ImageClassificationJob, ObjectDetectionJob } from './interfaces';

@Controller()
export class AppController {
  constructor(
    @InjectQueue(imageClassificationQueueName)
    private imageClassificationQueue: Queue<ImageClassificationJob>,

    @InjectQueue(objectDetectionQueueName)
    private objectDetectionQueue: Queue<ObjectDetectionJob>,
  ) {}

  @Post('/webhook')
  @HttpCode(HttpStatus.OK)
  async onWebhook(@Body() payload: WebhookPayloadDto) {
    switch (payload.type) {
      case WebhookEventTypes.AssetCreationEvent: {
        await this.imageClassificationQueue.add(payload.asset, { jobId: randomUUID() });
        await this.objectDetectionQueue.add(payload.asset, { jobId: randomUUID() });
        break;
      }
    
      default:
        break;
    }

    return {};
  }
}
