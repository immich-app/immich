import { Injectable, Logger } from '@nestjs/common';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';

@Injectable()
export class ObjectDetectionService {
  private cocoSsdModel: cocoSsd.ObjectDetection;

  constructor() {
    Logger.log(
      `Running Node TensorFlow Version : ${tf.version['tfjs']}`,
      'ObjectDetection',
    );
    cocoSsd.load().then((model) => (this.cocoSsdModel = model));
  }
  async detectObject(thumbnailPath: string) {
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
