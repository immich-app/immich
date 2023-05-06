import { Inject, Logger } from '@nestjs/common';
import { join } from 'path';
import { IAssetRepository, WithoutProperty } from '../asset';
import { MACHINE_LEARNING_ENABLED } from '../domain.constant';
import { IAssetJob, IBaseJob, IFaceThumbnailJob, IJobRepository, JobName } from '../job';
import { IMediaRepository } from '../media';
import { IPersonRepository } from '../person/person.repository';
import { ISearchRepository } from '../search/search.repository';
import { IMachineLearningRepository } from '../smart-info';
import { IStorageRepository, StorageCore, StorageFolder } from '../storage';
import { AssetFaceId, IFaceRepository } from './face.repository';

export class FacialRecognitionService {
  private logger = new Logger(FacialRecognitionService.name);
  private storageCore = new StorageCore();

  constructor(
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IFaceRepository) private faceRepository: IFaceRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(IMachineLearningRepository) private machineLearning: IMachineLearningRepository,
    @Inject(IMediaRepository) private mediaRepository: IMediaRepository,
    @Inject(IPersonRepository) private personService: IPersonRepository,
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
        // TODO: delete all faces?
      }

      for (const { embedding, ...rest } of faces) {
        const faceSearchResult = await this.searchRepository.searchFaces(embedding, { ownerId: asset.ownerId });

        let personId: string | null = null;

        // try to find a matching face and link to the associated person
        // The closer to 0, the better the match. Range is from 0 to 2
        if (faceSearchResult.total && faceSearchResult.distances[0] < 0.6) {
          this.logger.debug(`Match face with distance ${faceSearchResult.distances[0]}`);
          personId = faceSearchResult.items[0].personId;
        }

        if (!personId) {
          this.logger.debug('No matches, creating a new person.');
          const person = await this.personService.create({ ownerId: asset.ownerId });
          personId = person.id;
          await this.jobRepository.queue({
            name: JobName.GENERATE_FACE_THUMBNAIL,
            data: { assetId: asset.id, personId, ...rest },
          });
        }

        const faceId: AssetFaceId = { assetId: asset.id, personId };

        await this.faceRepository.create({ ...faceId, embedding });
        await this.jobRepository.queue({ name: JobName.SEARCH_INDEX_FACE, data: faceId });
        await this.jobRepository.queue({ name: JobName.SEARCH_INDEX_ASSET, data: { ids: [asset.id] } });
      }

      // queue all faces for asset
    } catch (error: any) {
      this.logger.error(`Unable run facial recognition pipeline: ${asset.id}`, error?.stack);
    }
  }

  async handleGenerateFaceThumbnail(data: IFaceThumbnailJob) {
    const { assetId, personId, boundingBox, imageWidth, imageHeight } = data;

    try {
      const [asset] = await this.assetRepository.getByIds([assetId]);
      if (!asset || !asset.resizePath) {
        this.logger.warn(`Asset not found for facial cropping: ${assetId}`);
        return null;
      }

      this.logger.debug(`Cropping face for person: ${personId}`);

      const outputFolder = this.storageCore.getFolderLocation(StorageFolder.THUMBNAILS, asset.ownerId);
      const output = join(outputFolder, `${personId}.jpeg`);
      this.storageRepository.mkdirSync(outputFolder);

      const { x1, y1, x2, y2 } = boundingBox;
      const imageHalfWidth = (x2 - x1) / 2;
      const imageHalfHeight = (y2 - y1) / 2;
      const middleX = x1 + imageHalfWidth;
      const middleY = y1 + imageHalfHeight;
      const zoomOutPixels = Math.max(imageHalfWidth, imageHalfHeight) * 1.1;

      // get the longest distance from the center of the image without overflowing
      const unit = Math.max(
        middleX - Math.max(0, middleX - zoomOutPixels),
        middleY - Math.max(0, middleY - zoomOutPixels),
        Math.min(imageWidth, middleX + zoomOutPixels) - middleX,
        Math.min(imageHeight, middleY + zoomOutPixels) - middleY,
      );

      const left = Math.round(middleX - unit);
      const top = Math.round(middleY - unit);
      const size = Math.round(unit * 2);

      // TODO: move to machine learning code
      // if (left < 1 || top < 1 || width < 1 || height < 1) {
      //   this.logger.error(`invalid bounding box ${JSON.stringify(face.boundingBox)}`);
      //   return null;
      // }

      await this.mediaRepository.crop(asset.resizePath, output, { left, top, width: size, height: size });
      await this.personService.update({ id: personId, thumbnailPath: output });
    } catch (error: any) {
      this.logger.error(`Failed to crop face for asset: ${assetId}, person: ${personId}`, error.stack);
    }
  }
}
