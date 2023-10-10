import { PersonEntity } from '@app/infra/entities';
import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AccessCore, Permission } from '../access';
import { AssetResponseDto, BulkIdErrorReason, BulkIdResponseDto, mapAsset } from '../asset';
import { AuthUserDto } from '../auth';
import { mimeTypes } from '../domain.constant';
import { usePagination } from '../domain.util';
import { IBaseJob, IEntityJob, JOBS_ASSET_PAGINATION_SIZE, JobName } from '../job';
import { FACE_THUMBNAIL_SIZE } from '../media';
import {
  AssetFaceId,
  CropOptions,
  IAccessRepository,
  IAssetRepository,
  IJobRepository,
  IMachineLearningRepository,
  IMediaRepository,
  IPersonRepository,
  ISearchRepository,
  IStorageRepository,
  ISystemConfigRepository,
  ImmichReadStream,
  UpdateFacesData,
  WithoutProperty,
} from '../repositories';
import { StorageCore, StorageFolder } from '../storage';
import { SystemConfigCore } from '../system-config';
import {
  MergePersonDto,
  PeopleResponseDto,
  PeopleUpdateDto,
  PersonResponseDto,
  PersonSearchDto,
  PersonUpdateDto,
  mapPerson,
} from './person.dto';

@Injectable()
export class PersonService {
  private access: AccessCore;
  private configCore: SystemConfigCore;
  private storageCore: StorageCore;
  readonly logger = new Logger(PersonService.name);

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IMachineLearningRepository) private machineLearningRepository: IMachineLearningRepository,
    @Inject(IMediaRepository) private mediaRepository: IMediaRepository,
    @Inject(IPersonRepository) private repository: IPersonRepository,
    @Inject(ISearchRepository) private searchRepository: ISearchRepository,
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
  ) {
    this.access = new AccessCore(accessRepository);
    this.storageCore = new StorageCore(storageRepository);
    this.configCore = SystemConfigCore.create(configRepository);
  }

  async getAll(authUser: AuthUserDto, dto: PersonSearchDto): Promise<PeopleResponseDto> {
    const { machineLearning } = await this.configCore.getConfig();
    const people = await this.repository.getAllForUser(authUser.id, {
      minimumFaceCount: machineLearning.facialRecognition.minFaces,
      withHidden: dto.withHidden || false,
    });
    const persons: PersonResponseDto[] = people
      // with thumbnails
      .filter((person) => !!person.thumbnailPath)
      .map((person) => mapPerson(person));

    return {
      people: persons.filter((person) => dto.withHidden || !person.isHidden),
      total: persons.length,
      visible: persons.filter((person: PersonResponseDto) => !person.isHidden).length,
    };
  }

  async getById(authUser: AuthUserDto, id: string): Promise<PersonResponseDto> {
    await this.access.requirePermission(authUser, Permission.PERSON_READ, id);
    return this.findOrFail(id).then(mapPerson);
  }

  async getThumbnail(authUser: AuthUserDto, id: string): Promise<ImmichReadStream> {
    await this.access.requirePermission(authUser, Permission.PERSON_READ, id);
    const person = await this.repository.getById(id);
    if (!person || !person.thumbnailPath) {
      throw new NotFoundException();
    }

    return this.storageRepository.createReadStream(person.thumbnailPath, mimeTypes.lookup(person.thumbnailPath));
  }

  async getAssets(authUser: AuthUserDto, id: string): Promise<AssetResponseDto[]> {
    await this.access.requirePermission(authUser, Permission.PERSON_READ, id);
    const assets = await this.repository.getAssets(id);
    return assets.map(mapAsset);
  }

  async update(authUser: AuthUserDto, id: string, dto: PersonUpdateDto): Promise<PersonResponseDto> {
    await this.access.requirePermission(authUser, Permission.PERSON_WRITE, id);
    let person = await this.findOrFail(id);

    const { name, birthDate, isHidden, featureFaceAssetId: assetId } = dto;

    if (name !== undefined || birthDate !== undefined || isHidden !== undefined) {
      person = await this.repository.update({ id, name, birthDate, isHidden });
      if (this.needsSearchIndexUpdate(dto)) {
        const assets = await this.repository.getAssets(id);
        const ids = assets.map((asset) => asset.id);
        await this.jobRepository.queue({ name: JobName.SEARCH_INDEX_ASSET, data: { ids } });
      }
    }

    if (assetId) {
      await this.access.requirePermission(authUser, Permission.ASSET_READ, assetId);
      const [face] = await this.repository.getFacesByIds([{ personId: id, assetId }]);
      if (!face) {
        throw new BadRequestException('Invalid assetId for feature face');
      }

      person = await this.repository.update({ id, faceAssetId: assetId });
      await this.jobRepository.queue({ name: JobName.GENERATE_PERSON_THUMBNAIL, data: { id } });
    }

    return mapPerson(person);
  }

  async updatePeople(authUser: AuthUserDto, dto: PeopleUpdateDto): Promise<BulkIdResponseDto[]> {
    const results: BulkIdResponseDto[] = [];
    for (const person of dto.people) {
      try {
        await this.update(authUser, person.id, {
          isHidden: person.isHidden,
          name: person.name,
          birthDate: person.birthDate,
          featureFaceAssetId: person.featureFaceAssetId,
        }),
          results.push({ id: person.id, success: true });
      } catch (error: Error | any) {
        this.logger.error(`Unable to update ${person.id} : ${error}`, error?.stack);
        results.push({ id: person.id, success: false, error: BulkIdErrorReason.UNKNOWN });
      }
    }
    return results;
  }

  async handlePersonDelete({ id }: IEntityJob) {
    const person = await this.repository.getById(id);
    if (!person) {
      return false;
    }

    try {
      await this.repository.delete(person);
      await this.storageRepository.unlink(person.thumbnailPath);
    } catch (error: Error | any) {
      this.logger.error(`Unable to delete person: ${error}`, error?.stack);
    }

    return true;
  }

  async handlePersonCleanup() {
    const people = await this.repository.getAllWithoutFaces();
    for (const person of people) {
      this.logger.debug(`Person ${person.name || person.id} no longer has any faces, deleting.`);
      await this.jobRepository.queue({ name: JobName.PERSON_DELETE, data: { id: person.id } });
    }

    return true;
  }

  async handleQueueRecognizeFaces({ force }: IBaseJob) {
    const { machineLearning } = await this.configCore.getConfig();
    if (!machineLearning.enabled || !machineLearning.facialRecognition.enabled) {
      return true;
    }

    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) => {
      return force
        ? this.assetRepository.getAll(pagination, { order: 'DESC' })
        : this.assetRepository.getWithout(pagination, WithoutProperty.FACES);
    });

    if (force) {
      const people = await this.repository.getAll();
      for (const person of people) {
        await this.jobRepository.queue({ name: JobName.PERSON_DELETE, data: { id: person.id } });
      }
      const faces = await this.searchRepository.deleteAllFaces();
      this.logger.debug(`Deleted ${people} people and ${faces} faces`);
    }

    for await (const assets of assetPagination) {
      for (const asset of assets) {
        await this.jobRepository.queue({ name: JobName.RECOGNIZE_FACES, data: { id: asset.id } });
      }
    }

    return true;
  }

  async handleRecognizeFaces({ id }: IEntityJob) {
    const { machineLearning } = await this.configCore.getConfig();
    if (!machineLearning.enabled || !machineLearning.facialRecognition.enabled) {
      return true;
    }

    const [asset] = await this.assetRepository.getByIds([id]);
    if (!asset || !asset.resizePath) {
      return false;
    }

    const faces = await this.machineLearningRepository.detectFaces(
      machineLearning.url,
      { imagePath: asset.resizePath },
      machineLearning.facialRecognition,
    );

    this.logger.debug(`${faces.length} faces detected in ${asset.resizePath}`);
    this.logger.verbose(faces.map((face) => ({ ...face, embedding: `float[${face.embedding.length}]` })));

    for (const { embedding, ...rest } of faces) {
      const faceSearchResult = await this.searchRepository.searchFaces(embedding, { ownerId: asset.ownerId });

      let personId: string | null = null;

      // try to find a matching face and link to the associated person
      // The closer to 0, the better the match. Range is from 0 to 2
      if (faceSearchResult.total && faceSearchResult.distances[0] <= machineLearning.facialRecognition.maxDistance) {
        this.logger.verbose(`Match face with distance ${faceSearchResult.distances[0]}`);
        personId = faceSearchResult.items[0].personId;
      }

      let newPerson: PersonEntity | null = null;
      if (!personId) {
        this.logger.debug('No matches, creating a new person.');
        newPerson = await this.repository.create({ ownerId: asset.ownerId });
        personId = newPerson.id;
      }

      const faceId: AssetFaceId = { assetId: asset.id, personId };
      await this.repository.createFace({
        ...faceId,
        embedding,
        imageHeight: rest.imageHeight,
        imageWidth: rest.imageWidth,
        boundingBoxX1: rest.boundingBox.x1,
        boundingBoxX2: rest.boundingBox.x2,
        boundingBoxY1: rest.boundingBox.y1,
        boundingBoxY2: rest.boundingBox.y2,
      });
      await this.jobRepository.queue({ name: JobName.SEARCH_INDEX_FACE, data: faceId });

      if (newPerson) {
        await this.repository.update({ id: personId, faceAssetId: asset.id });
        await this.jobRepository.queue({ name: JobName.GENERATE_PERSON_THUMBNAIL, data: { id: newPerson.id } });
      }
    }

    return true;
  }

  async handlePersonMigration({ id }: IEntityJob) {
    const person = await this.repository.getById(id);
    if (!person) {
      return false;
    }

    const path = this.storageCore.ensurePath(StorageFolder.THUMBNAILS, person.ownerId, `${id}.jpeg`);
    if (person.thumbnailPath && person.thumbnailPath !== path) {
      await this.storageRepository.moveFile(person.thumbnailPath, path);
      await this.repository.update({ id, thumbnailPath: path });
    }

    return true;
  }

  async handleGeneratePersonThumbnail(data: IEntityJob) {
    const { machineLearning, thumbnail } = await this.configCore.getConfig();
    if (!machineLearning.enabled || !machineLearning.facialRecognition.enabled) {
      return true;
    }

    const person = await this.repository.getById(data.id);
    if (!person?.faceAssetId) {
      return false;
    }

    const [face] = await this.repository.getFacesByIds([{ personId: person.id, assetId: person.faceAssetId }]);
    if (!face) {
      return false;
    }

    const {
      assetId,
      personId,
      boundingBoxX1: x1,
      boundingBoxX2: x2,
      boundingBoxY1: y1,
      boundingBoxY2: y2,
      imageWidth,
      imageHeight,
    } = face;

    const [asset] = await this.assetRepository.getByIds([assetId]);
    if (!asset?.resizePath) {
      return false;
    }

    this.logger.verbose(`Cropping face for person: ${personId}`);

    const thumbnailPath = this.storageCore.ensurePath(StorageFolder.THUMBNAILS, asset.ownerId, `${personId}.jpeg`);

    const halfWidth = (x2 - x1) / 2;
    const halfHeight = (y2 - y1) / 2;

    const middleX = Math.round(x1 + halfWidth);
    const middleY = Math.round(y1 + halfHeight);

    // zoom out 10%
    const targetHalfSize = Math.floor(Math.max(halfWidth, halfHeight) * 1.1);

    // get the longest distance from the center of the image without overflowing
    const newHalfSize = Math.min(
      middleX - Math.max(0, middleX - targetHalfSize),
      middleY - Math.max(0, middleY - targetHalfSize),
      Math.min(imageWidth - 1, middleX + targetHalfSize) - middleX,
      Math.min(imageHeight - 1, middleY + targetHalfSize) - middleY,
    );

    const cropOptions: CropOptions = {
      left: middleX - newHalfSize,
      top: middleY - newHalfSize,
      width: newHalfSize * 2,
      height: newHalfSize * 2,
    };

    const croppedOutput = await this.mediaRepository.crop(asset.resizePath, cropOptions);
    const thumbnailOptions = {
      format: 'jpeg',
      size: FACE_THUMBNAIL_SIZE,
      colorspace: thumbnail.colorspace,
      quality: thumbnail.quality,
    } as const;

    await this.mediaRepository.resize(croppedOutput, thumbnailPath, thumbnailOptions);
    await this.repository.update({ id: personId, thumbnailPath });

    return true;
  }

  async mergePerson(authUser: AuthUserDto, id: string, dto: MergePersonDto): Promise<BulkIdResponseDto[]> {
    const mergeIds = dto.ids;
    await this.access.requirePermission(authUser, Permission.PERSON_WRITE, id);
    const primaryPerson = await this.findOrFail(id);
    const primaryName = primaryPerson.name || primaryPerson.id;

    const results: BulkIdResponseDto[] = [];

    for (const mergeId of mergeIds) {
      const hasPermission = await this.access.hasPermission(authUser, Permission.PERSON_MERGE, mergeId);

      if (!hasPermission) {
        results.push({ id: mergeId, success: false, error: BulkIdErrorReason.NO_PERMISSION });
        continue;
      }

      try {
        const mergePerson = await this.repository.getById(mergeId);
        if (!mergePerson) {
          results.push({ id: mergeId, success: false, error: BulkIdErrorReason.NOT_FOUND });
          continue;
        }

        const mergeName = mergePerson.name || mergePerson.id;
        const mergeData: UpdateFacesData = { oldPersonId: mergeId, newPersonId: id };
        this.logger.log(`Merging ${mergeName} into ${primaryName}`);

        const assetIds = await this.repository.prepareReassignFaces(mergeData);
        for (const assetId of assetIds) {
          await this.jobRepository.queue({ name: JobName.SEARCH_REMOVE_FACE, data: { assetId, personId: mergeId } });
        }
        await this.repository.reassignFaces(mergeData);
        await this.jobRepository.queue({ name: JobName.PERSON_DELETE, data: { id: mergePerson.id } });

        this.logger.log(`Merged ${mergeName} into ${primaryName}`);
        results.push({ id: mergeId, success: true });
      } catch (error: Error | any) {
        this.logger.error(`Unable to merge ${mergeId} into ${id}: ${error}`, error?.stack);
        results.push({ id: mergeId, success: false, error: BulkIdErrorReason.UNKNOWN });
      }
    }

    // Re-index all faces in typesense for up-to-date search results
    await this.jobRepository.queue({ name: JobName.SEARCH_INDEX_FACES });

    return results;
  }

  /**
   * Returns true if the given person update is going to require an update of the search index.
   * @param dto the Person going to be updated
   * @private
   */
  private needsSearchIndexUpdate(dto: PersonUpdateDto): boolean {
    return dto.name !== undefined || dto.isHidden !== undefined;
  }

  private async findOrFail(id: string) {
    const person = await this.repository.getById(id);
    if (!person) {
      throw new BadRequestException('Person not found');
    }
    return person;
  }
}
