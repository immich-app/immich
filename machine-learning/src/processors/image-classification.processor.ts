import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as tf from '@tensorflow/tfjs-node';
import { Job } from 'bull';
import * as fs from 'fs';
import { imageClassificationQueueName } from '../constants/queue-name.constant';
import { ImageClassificationJob } from '../interfaces';

@Injectable()
@Processor(imageClassificationQueueName)
export class ImageClassificationProcessor implements OnModuleInit {
  private readonly MOBILENET_VERSION = 2;
  private readonly MOBILENET_ALPHA = 1.0;

  private mobileNetModel: mobilenet.MobileNet;

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
    const { thumbnailPath } = job.data;

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
        return tags;
      }
    } catch (e) {
      console.log('Error reading file ', e);
    }
  }
}
