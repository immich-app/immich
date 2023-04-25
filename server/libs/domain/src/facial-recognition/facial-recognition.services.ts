import { Inject, Logger } from '@nestjs/common';
import { IAssetJob } from '../job';
import { MACHINE_LEARNING_ENABLED } from '../domain.constant';
import { IMachineLearningRepository } from '../smart-info';
import { ISearchRepository } from '../search';
import { IFacialRecognitionRepository } from './facial-recognition.repository';
import { MediaService } from '../media';

export class FacialRecognitionService {
  private logger = new Logger(FacialRecognitionService.name);

  constructor(
    @Inject(IFacialRecognitionRepository) repository: IFacialRecognitionRepository,
    @Inject(IMachineLearningRepository) private machineLearning: IMachineLearningRepository,
    @Inject(ISearchRepository) private searchRepository: ISearchRepository,
    private mediaService: MediaService,
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
        faces.forEach(async (face) => {
          const faceSearchResult = await this.searchRepository.faceSearch(face.normed_embedding);

          if (faceSearchResult.total) {
            console.log('Found face', faceSearchResult);
          } else {
            this.mediaService.cropFace(asset.id, face.bbox);
            console.log('No face found - create new face');
          }
        });
      }
    } catch (error: any) {
      this.logger.error(`Unable run facial recognition pipeline: ${asset.id}`, error?.stack);
    }
  }
}
