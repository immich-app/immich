import { AssetFaceEntity, PersonEntity } from '@app/infra/entities';
import { Inject, Logger } from '@nestjs/common';
import { join } from 'path';
import { IAssetRepository, WithoutProperty } from '../asset';
import { ICryptoRepository } from '../crypto';
import { MACHINE_LEARNING_ENABLED } from '../domain.constant';
import { IAssetJob, IBaseJob, IJobRepository, JobName } from '../job';
import { CropOptions, IMediaRepository } from '../media';
import { ISearchRepository } from '../search';
import { DetectFaceResult, IMachineLearningRepository } from '../smart-info';
import { IStorageRepository, StorageCore, StorageFolder } from '../storage';
import { IFacialRecognitionRepository } from './facial-recognition.repository';

export interface CropFaceResult {
  faceId: string;
  filePath: string;
}

export class FacialRecognitionService {
  private logger = new Logger(FacialRecognitionService.name);
  private storageCore = new StorageCore();

  constructor(
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(ICryptoRepository) private cryptoRepository: ICryptoRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(IFacialRecognitionRepository) private repository: IFacialRecognitionRepository,
    @Inject(IMachineLearningRepository) private machineLearning: IMachineLearningRepository,
    @Inject(IMediaRepository) private mediaRepository: IMediaRepository,
    @Inject(ISearchRepository) private searchRepository: ISearchRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
  ) {}

  async handleQueueRecognizeFaces({ force }: IBaseJob) {
    try {
      const assets = force
        ? await this.assetRepository.getAll()
        : await this.assetRepository.getWithout(WithoutProperty.FACES);

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
      const faces = await this.machineLearning.detectFaces({ thumbnailPath: asset.resizePath });

      this.logger.debug(`${faces.length} faces detected in ${asset.resizePath}`);
      this.logger.verbose(faces.map((face) => ({ ...face, embedding: `float[${face.embedding.length}]` })));

      if (faces.length > 0) {
        // typesense magic here
        faces.forEach(async (face) => {
          const faceSearchResult = await this.searchRepository.faceSearch(face.embedding);

          if (faceSearchResult.total) {
            this.logger.debug('Found face', faceSearchResult);
          } else {
            this.logger.debug('No person with associated face found, creating new person');
            const cropFaceResult = await this.cropFace(asset.id, face);

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

  async cropFace(assetId: string, face: DetectFaceResult): Promise<CropFaceResult | null> {
    const [asset] = await this.assetRepository.getByIds([assetId]);

    if (!asset || !asset.resizePath) {
      this.logger.warn(`Asset not found for facial cropping: ${assetId}`);
      return null;
    }

    const faceId = this.cryptoRepository.randomUUID();
    const outputFolder = this.storageCore.getFolderLocation(StorageFolder.THUMBNAILS, asset.ownerId);
    const output = join(outputFolder, `${faceId}.jpeg`);
    this.storageRepository.mkdirSync(outputFolder);

    const left = Math.round(face.boundingBox.x1);
    const top = Math.round(face.boundingBox.y1);
    const width = Math.round(face.boundingBox.x2 - face.boundingBox.x1);
    const height = Math.round(face.boundingBox.y2 - face.boundingBox.y1);

    if (left < 1 || top < 1 || width < 1 || height < 1) {
      this.logger.error(`invalid bounding box ${JSON.stringify(face.boundingBox)}`);
      return null;
    }

    const cropOptions: CropOptions = {
      left: left,
      top: top,
      width: width,
      height: height,
    };
    try {
      await this.mediaRepository.crop(asset.resizePath, output, cropOptions);

      const result: CropFaceResult = {
        faceId: faceId,
        filePath: output,
      };

      return result;
    } catch (error: any) {
      this.logger.error(`Failed to crop face for asset: ${asset.id}`, error.stack);
      return null;
    }
  }
}
