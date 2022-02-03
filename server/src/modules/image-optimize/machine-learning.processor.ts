import { Process, Processor } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import { Repository } from 'typeorm';
import { AssetEntity } from '../../api-v1/asset/entities/asset.entity';
import fs from 'fs';
import { ConfigService } from '@nestjs/config';
import * as tfnode from '@tensorflow/tfjs-node';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

@Processor('machine-learning')
export class MachineLearningProcessor {
  constructor(
    @InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>,
    private configService: ConfigService,
  ) {}

  @Process('object-detection')
  async handleOptimization(job: Job) {
    try {
      const { resizePath }: { resizePath: string } = job.data;

      const image = fs.readFileSync(resizePath);
      const decodedImage = tfnode.node.decodeImage(image, 3) as tfnode.Tensor3D;
      const model = await cocoSsd.load();
      const predictions = await model.detect(decodedImage);
      console.log('\n\nstart predictions ------------------ ');
      for (var result of predictions) {
        console.log(`Found ${result.class} with score ${result.score}`);
      }
      console.log('end predictions ------------------\n\n');

      return 'ok';
    } catch (e) {
      console.log('Error object detection ', e);
    }
  }
}
