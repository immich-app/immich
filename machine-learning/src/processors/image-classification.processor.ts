import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as tf from '@tensorflow/tfjs-node';
import { Job } from 'bull';
import * as fs from 'fs';
import { Repository } from 'typeorm';
import { imageClassificationQueueName } from '../constants/queue-name.constant';
import { SmartInfoEntity } from '../entities/smart-info.entity';
import { ImageClassificationJob } from '../interfaces';

@Injectable()
@Processor(imageClassificationQueueName)
export class ImageClassificationProcessor implements OnModuleInit {
  private readonly MOBILENET_VERSION = 2;
  private readonly MOBILENET_ALPHA = 1.0;

  private mobileNetModel: mobilenet.MobileNet;

  constructor(
    @InjectRepository(SmartInfoEntity)
    private smartInfoRepository: Repository<SmartInfoEntity>,
  ) {}

  async onModuleInit() {
    Logger.log(
      `Running Node TensorFlow Version : ${tf.version['tfjs']}`,
      'ImageClassifier',
    );
    this.mobileNetModel = await mobilenet.load({
      version: this.MOBILENET_VERSION,
      alpha: this.MOBILENET_ALPHA,
    });
  }

  @Process()
  async classifyImage(job: Job<ImageClassificationJob>) {
    const asset = job.data;
    const thumbnailPath = asset.resizePath;

    try {
      const isExist = fs.existsSync(thumbnailPath);
      if (isExist) {
        const tags = [];
        const image = fs.readFileSync(thumbnailPath);
        const decodedImage = tf.node.decodeImage(image, 3) as tf.Tensor3D;
        const predictions = await this.mobileNetModel.classify(decodedImage);

        for (const prediction of predictions) {
          if (prediction.probability >= 0.1) {
            tags.push(...prediction.className.split(',').map((e) => e.trim()));
          }
        }

        tf.dispose(decodedImage);
        // return tags;

        // add smart info for asset
        const smartInfo = new SmartInfoEntity();
        smartInfo.assetId = asset.id;
        smartInfo.tags = tags;

        await this.smartInfoRepository.upsert(smartInfo, {
          conflictPaths: ['assetId'],
        });
      }
    } catch (e) {
      console.log('Failed to trigger image classification pipe line ', e);
    }
  }
}
