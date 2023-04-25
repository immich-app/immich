import { Inject, Logger } from '@nestjs/common';
import { IAssetJob, IBaseJob, IJobRepository, JobName } from '../job';
import { MACHINE_LEARNING_ENABLED } from '../domain.constant';
import { IMachineLearningRepository } from '../smart-info';
import { ISearchRepository } from '../search';
import { IFacialRecognitionRepository } from './facial-recognition.repository';
import { MediaService } from '../media';
import { IAssetRepository, WithoutProperty } from '../asset';
import { PersonEntity, AssetFaceEntity } from '@app/infra/entities';

export class FacialRecognitionService {
  private logger = new Logger(FacialRecognitionService.name);

  constructor(
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(IFacialRecognitionRepository) private repository: IFacialRecognitionRepository,
    @Inject(IMachineLearningRepository) private machineLearning: IMachineLearningRepository,
    @Inject(ISearchRepository) private searchRepository: ISearchRepository,
    private mediaService: MediaService,
  ) {}
  async handleQueueRecognizeFaces({ force }: IBaseJob) {
    try {
      const assets = force
        ? await this.assetRepository.getAll()
        : await this.assetRepository.getWithout(WithoutProperty.OBJECT_TAGS);

      for (const asset of assets) {
        await this.jobRepository.queue({ name: JobName.RECOGNIZE_FACES, data: { asset } });
      }
    } catch (error: any) {
      this.logger.error(`Unable to queue recognize faces`, error?.stack);
    }
  }

  async handleRecognizeFaces(data: IAssetJob) {
    const { asset } = data;

    if (!MACHINE_LEARNING_ENABLED || !asset.resizePath) {
      return;
    }

    try {
      const faces = await this.machineLearning.recognizeFaces({ thumbnailPath: asset.resizePath });

      this.logger.verbose(`${faces.length} faces detected in ${asset.resizePath}`);

      if (faces.length > 0) {
        // typesense magic here
        faces.forEach(async (face) => {
          const faceSearchResult = await this.searchRepository.faceSearch(face.embedding);

          if (faceSearchResult.total) {
            this.logger.debug('Found face', faceSearchResult);
          } else {
            this.logger.debug('No person with associated found, creating new person');
            const cropFaceResult = await this.mediaService.cropFace(asset.id, face);

            if (!cropFaceResult) return;

            const person = new PersonEntity();
            person.id = cropFaceResult.faceId;
            person.owner = asset.owner;
            person.ownerId = asset.ownerId;
            person.thumbnailPath = cropFaceResult.filePath;
            person.name = 'Unknown';

            const assetFace = new AssetFaceEntity();
            assetFace.embedding = face.embedding;
            assetFace.asset = asset;
            assetFace.assetId = asset.id;
            assetFace.personId = cropFaceResult.faceId;

            await this.repository.save(person, assetFace);
          }
        });
      }
    } catch (error: any) {
      this.logger.error(`Unable run facial recognition pipeline: ${asset.id}`, error?.stack);
    }
  }
}
