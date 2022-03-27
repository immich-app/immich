import { Injectable, Logger } from '@nestjs/common';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';

@Injectable()
export class ImageClassifierService {
  private readonly MOBILENET_VERSION = 2;
  private readonly MOBILENET_ALPHA = 1.0;

  private mobileNetModel: mobilenet.MobileNet;

  constructor() {
    Logger.log(
      `Running Node TensorFlow Version : ${tf.version['tfjs']}`,
      'ImageClassifier',
    );
    mobilenet
      .load({
        version: this.MOBILENET_VERSION,
        alpha: this.MOBILENET_ALPHA,
      })
      .then((mobilenetModel) => (this.mobileNetModel = mobilenetModel));
  }

  async tagImage(thumbnailPath: string) {
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

        return tags;
      }
    } catch (e) {
      console.log('Error reading file ', e);
    }
  }
}
