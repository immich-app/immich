import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs-node';
import { Job } from 'bull';
import * as fs from 'fs';
import { objectDetectionQueueName } from '../constants/queue-name.constant';
import { ObjectDetectionJob } from '../interfaces';

@Injectable()
@Processor(objectDetectionQueueName)
export class ObjectDetectionProcessor implements OnModuleInit {
  private cocoSsdModel: cocoSsd.ObjectDetection;

  async onModuleInit() {
    Logger.log(
      `Running Node TensorFlow Version : ${tf.version['tfjs']}`,
      'ObjectDetection',
    );
    this.cocoSsdModel = await cocoSsd.load();
  }

  @Process()
  async detectObject(job: Job<ObjectDetectionJob>) {
    const { thumbnailPath } = job.data;

    try {
      const isExist = fs.existsSync(thumbnailPath);
      if (isExist) {
        const tags = new Set();
        const image = fs.readFileSync(thumbnailPath);
        const decodedImage = tf.node.decodeImage(image, 3) as tf.Tensor3D;
        const predictions = await this.cocoSsdModel.detect(decodedImage);

        for (const result of predictions) {
          if (result.score > 0.5) {
            tags.add(result.class);
          }
        }

        tf.dispose(decodedImage);
        return [...tags];
      }
    } catch (e) {
      console.log('Error reading file ', e);
    }
  }
}
