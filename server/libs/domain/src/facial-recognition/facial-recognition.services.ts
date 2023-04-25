import { AssetEntity, AssetType } from '@app/infra/entities';
import { Inject, Logger } from '@nestjs/common';
import { IAssetJob, IAssetUploadedJob, IJobRepository, JobName } from '../job';
import { AssetCore, IAssetRepository } from '../asset';
import { MACHINE_LEARNING_ENABLED } from '../domain.constant';
import { IMachineLearningRepository } from '../smart-info';

export class FacialRecognitionService {
  private logger = new Logger(FacialRecognitionService.name);

  constructor(
    @Inject(IAssetRepository) assetRepository: IAssetRepository,
    @Inject(IMachineLearningRepository) private machineLearning: IMachineLearningRepository,
  ) {}

  async handleRecognizeFaces(data: IAssetJob) {
    const { asset } = data;

    if (!MACHINE_LEARNING_ENABLED || !asset.resizePath) {
      return;
    }

    try {
      const faces = await this.machineLearning.recognizeFaces({ thumbnailPath: asset.resizePath });
      console.log('faces detected', faces.length);
      if (faces.length > 0) {
        // typesense magic here
      }
    } catch (error: any) {
      this.logger.error(`Unable run facial recognition pipeline: ${asset.id}`, error?.stack);
    }
  }
}
