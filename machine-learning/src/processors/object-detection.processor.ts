import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs-node';
import { Job } from 'bull';
import * as fs from 'fs';
import { Repository } from 'typeorm';
import { objectDetectionQueueName } from '../constants/queue-name.constant';
import { SmartInfoEntity } from '../entities/smart-info.entity';
import { ObjectDetectionJob } from '../interfaces';

@Injectable()
@Processor(objectDetectionQueueName)
export class ObjectDetectionProcessor implements OnModuleInit {
  private cocoSsdModel: cocoSsd.ObjectDetection;

  constructor(
    @InjectRepository(SmartInfoEntity)
    private smartInfoRepository: Repository<SmartInfoEntity>,
  ) {}

  async onModuleInit() {
    Logger.log(
      `Running Node TensorFlow Version : ${tf.version['tfjs']}`,
      'ObjectDetection',
    );
    this.cocoSsdModel = await cocoSsd.load();
  }

  @Process()
  async detectObject(job: Job<ObjectDetectionJob>) {
    const asset = job.data;
    const thumbnailPath = asset.resizePath;

    try {
      const isExist = fs.existsSync(thumbnailPath);
      if (isExist) {
        const tags = new Set<string>();
        const image = fs.readFileSync(thumbnailPath);
        const decodedImage = tf.node.decodeImage(image, 3) as tf.Tensor3D;
        const predictions = await this.cocoSsdModel.detect(decodedImage);

        for (const result of predictions) {
          if (result.score > 0.5) {
            tags.add(result.class);
          }
        }

        tf.dispose(decodedImage);
        // return [...tags];

        // add smart info for asset
        const smartInfo = new SmartInfoEntity();
        smartInfo.assetId = asset.id;
        smartInfo.objects = [...tags.values()];

        await this.smartInfoRepository.upsert(smartInfo, {
          conflictPaths: ['assetId'],
        });
      }
    } catch (e) {
      console.log('Failed to trigger object detection pipe line ', e);
    }
  }
}
