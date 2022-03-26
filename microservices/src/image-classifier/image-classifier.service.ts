import { Injectable, Logger } from '@nestjs/common';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';

@Injectable()
export class ImageClassifierService {
  private readonly MOBILENET_VERSION = 2;
  private readonly MOBILENET_ALPHA = 0.5;

  private mobileNetModel: mobilenet.MobileNet;
  private cocoSsdModel: cocoSsd.ObjectDetection;

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

    cocoSsd.load().then((model) => (this.cocoSsdModel = model));
  }

  async tagImage(thumbnailPath: string) {
    try {
      const isExist = fs.existsSync(thumbnailPath);
      if (isExist) {
        const tags = [];
        const image = fs.readFileSync(thumbnailPath);
        const decodedImage = tf.node.decodeImage(image, 3) as tf.Tensor3D;
        // const predictions = await this.cocoSsdModel.detect(decodedImage);
        const predictions = await this.mobileNetModel.classify(decodedImage);
        // console.log('Predictions');
        // console.log(predictions);
        // console.log('\n\nstart predictions ------------------ ');
        // for (var result of predictions) {
        //   console.log(`Found ${result.class} with score ${result.score}`);
        // }
        // console.log('end predictions ------------------\n\n');

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
