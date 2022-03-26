import { Body, Controller, Post } from '@nestjs/common';
import { ImageClassifierService } from './image-classifier.service';
import { CreateImageClassifierDto } from './dto/create-image-classifier.dto';
import * as tf from '@tensorflow/tfjs-core';
import * as tfnode from '@tensorflow/tfjs-node';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as fs from 'fs';

@Controller()
export class ImageClassifierController {
  private readonly MOBILENET_VERSION = 2;
  private readonly MOBILENET_ALPHA = 0.5;

  private mobileNetModel: mobilenet.MobileNet;
  private cocoSsdModel: cocoSsd.ObjectDetection;
  constructor(private readonly imageClassifierService: ImageClassifierService) {
    console.log('Running Node TensorFlow Version :', tfnode.version['tfjs']);

    mobilenet
      .load({
        version: this.MOBILENET_VERSION,
        alpha: this.MOBILENET_ALPHA,
      })
      .then((mobilenetModel) => (this.mobileNetModel = mobilenetModel));

    cocoSsd.load().then((model) => (this.cocoSsdModel = model));
  }

  @Post('/tagImage')
  // tagImage(@Payload() createImageClassifierDto: CreateImageClassifierDto) {
  async tagImage(@Body('thumbnailPath') thumbnailPath: string) {
    try {
      const isExist = fs.existsSync(thumbnailPath);
      if (isExist) {
        const image = fs.readFileSync(thumbnailPath);
        const decodedImage = tfnode.node.decodeImage(
          image,
          3,
        ) as tfnode.Tensor3D;
        // const predictions = await this.cocoSsdModel.detect(decodedImage);
        const predictions = await this.mobileNetModel.classify(decodedImage);
        console.log('Predictions');
        console.log(predictions);
        // console.log('\n\nstart predictions ------------------ ');
        // for (var result of predictions) {
        //   console.log(`Found ${result.class} with score ${result.score}`);
        // }
        // console.log('end predictions ------------------\n\n');
        return 'ok';
      }
    } catch (e) {
      console.log('Error reading file ', e);
    }
  }
}
