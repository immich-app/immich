import { AssetEntity } from '@app/infra';
import { SmartInfoEntity } from '@app/infra';
import { QueueName, JobName } from '@app/domain';
import { IMachineLearningJob } from '@app/domain';
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Job } from 'bull';
import { Repository } from 'typeorm';
import { MACHINE_LEARNING_ENABLED, MACHINE_LEARNING_URL } from '@app/common';

@Processor(QueueName.MACHINE_LEARNING)
export class MachineLearningProcessor {
  constructor(
    @InjectRepository(SmartInfoEntity)
    private smartInfoRepository: Repository<SmartInfoEntity>,
  ) {}

  @Process({ name: JobName.IMAGE_TAGGING, concurrency: 2 })
  async tagImage(job: Job<IMachineLearningJob>) {
    if (!MACHINE_LEARNING_ENABLED) {
      return;
    }

    const { asset } = job.data;

    const res = await axios.post(MACHINE_LEARNING_URL + '/image-classifier/tag-image', {
      thumbnailPath: asset.resizePath,
    });

    if (res.status == 201 && res.data.length > 0) {
      const smartInfo = new SmartInfoEntity();
      smartInfo.assetId = asset.id;
      smartInfo.tags = [...res.data];

      await this.smartInfoRepository.upsert(smartInfo, {
        conflictPaths: ['assetId'],
      });
    }
  }

  @Process({ name: JobName.OBJECT_DETECTION, concurrency: 2 })
  async detectObject(job: Job<IMachineLearningJob>) {
    if (!MACHINE_LEARNING_ENABLED) {
      return;
    }

    try {
      const { asset }: { asset: AssetEntity } = job.data;

      const res = await axios.post(MACHINE_LEARNING_URL + '/object-detection/detect-object', {
        thumbnailPath: asset.resizePath,
      });

      if (res.status == 201 && res.data.length > 0) {
        const smartInfo = new SmartInfoEntity();
        smartInfo.assetId = asset.id;
        smartInfo.objects = [...res.data];

        await this.smartInfoRepository.upsert(smartInfo, {
          conflictPaths: ['assetId'],
        });
      }
    } catch (error) {
      Logger.error(`Failed to trigger object detection pipe line ${String(error)}`);
    }
  }
}
