import { AssetEntity } from '@app/database/entities/asset.entity';
import { TagEntity, TagType } from '@app/database/entities/tag.entity';
import { MachineLearningJobNameEnum, QueueNameEnum } from '@app/job';
import { IMachineLearningJob } from '@app/job/interfaces/machine-learning.interface';
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Job } from 'bull';
import { Repository } from 'typeorm';

const immich_machine_learning_url = process.env.IMMICH_MACHINE_LEARNING_URL || 'http://immich-machine-learning:3003';

@Processor(QueueNameEnum.MACHINE_LEARNING)
export class MachineLearningProcessor {
  readonly logger = new Logger(MachineLearningProcessor.name);

  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,

    @InjectRepository(TagEntity)
    private tagRepository: Repository<TagEntity>,
  ) {}

  @Process({ name: MachineLearningJobNameEnum.IMAGE_TAGGING, concurrency: 2 })
  async tagImage(job: Job<IMachineLearningJob>) {
    try {
      const { asset } = job.data;

      const res = await axios.post(immich_machine_learning_url + '/image-classifier/tag-image', {
        thumbnailPath: asset.resizePath,
      });

      if (res.status == 201 && res.data.length > 0) {
        this.createAndSaveTagToAsset(asset, res.data);
      }
    } catch (e) {
      this.logger.error(e);
    }
  }

  @Process({ name: MachineLearningJobNameEnum.OBJECT_DETECTION, concurrency: 2 })
  async detectObject(job: Job<IMachineLearningJob>) {
    try {
      const { asset }: { asset: AssetEntity } = job.data;

      const res = await axios.post(immich_machine_learning_url + '/object-detection/detect-object', {
        thumbnailPath: asset.resizePath,
      });

      if (res.status == 201 && res.data.length > 0) {
        this.createAndSaveTagToAsset(asset, res.data);
      }
    } catch (e) {
      this.logger.error(e);
    }
  }

  private async createAndSaveTagToAsset(asset: AssetEntity, tagNames: string[]) {
    try {
      const immichTags: TagEntity[] = [];

      const assetEntity = await this.assetRepository.findOne({ where: { id: asset.id } });

      if (!assetEntity) {
        return;
      }

      for (const tag of tagNames) {
        let immichTag: TagEntity | null;

        immichTag = await this.tagRepository.findOne({ where: { name: tag, userId: asset.userId } });

        if (!immichTag) {
          immichTag = new TagEntity();
          immichTag.name = tag;
          immichTag.type = TagType.OBJECT;
          immichTag.userId = asset.userId;
        }

        immichTags.push(immichTag);
      }

      assetEntity.tags = assetEntity.tags ? Array.from(new Set([...assetEntity.tags, ...immichTags])) : immichTags;
      await this.assetRepository.save(assetEntity);
    } catch (e) {
      this.logger.error(e);
    }
  }
}
