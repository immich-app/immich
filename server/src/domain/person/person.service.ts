import { PersonEntity } from '@app/infra/entities';
import { PersonPathType } from '@app/infra/entities/move.entity';
import { ImmichLogger } from '@app/infra/logger';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AccessCore, Permission } from '../access';
import { AssetResponseDto, BulkIdErrorReason, BulkIdResponseDto, mapAsset } from '../asset';
import { AuthDto } from '../auth';
import { mimeTypes } from '../domain.constant';
import { ImmichFileResponse, usePagination } from '../domain.util';
import { IBaseJob, IEntityJob, JOBS_ASSET_PAGINATION_SIZE, JobName } from '../job';
import { FACE_THUMBNAIL_SIZE } from '../media';
import {
  CropOptions,
  IAccessRepository,
  IAssetRepository,
  IJobRepository,
  IMachineLearningRepository,
  IMediaRepository,
  IMoveRepository,
  IPersonRepository,
  ISmartInfoRepository,
  IStorageRepository,
  ISystemConfigRepository,
  UpdateFacesData,
  WithoutProperty,
} from '../repositories';
import { StorageCore } from '../storage';
import { SystemConfigCore } from '../system-config';
import {
  AssetFaceResponseDto,
  AssetFaceUpdateDto,
  FaceDto,
  MergePersonDto,
  PeopleResponseDto,
  PeopleUpdateDto,
  PersonResponseDto,
  PersonSearchDto,
  PersonStatisticsResponseDto,
  PersonUpdateDto,
  mapFaces,
  mapPerson,
} from './person.dto';

@Injectable()
export class PersonService {
  private access: AccessCore;
  private configCore: SystemConfigCore;
  private storageCore: StorageCore;
  readonly logger = new ImmichLogger(PersonService.name);

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IMachineLearningRepository) private machineLearningRepository: IMachineLearningRepository,
    @Inject(IMoveRepository) moveRepository: IMoveRepository,
    @Inject(IMediaRepository) private mediaRepository: IMediaRepository,
    @Inject(IPersonRepository) private repository: IPersonRepository,
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(ISmartInfoRepository) private smartInfoRepository: ISmartInfoRepository,
  ) {
    this.access = AccessCore.create(accessRepository);
    this.configCore = SystemConfigCore.create(configRepository);
    this.storageCore = StorageCore.create(assetRepository, moveRepository, repository, storageRepository);
  }

  async getAll(auth: AuthDto, dto: PersonSearchDto): Promise<PeopleResponseDto> {
    const { machineLearning } = await this.configCore.getConfig();
    const people = await this.repository.getAllForUser(auth.user.id, {
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

  createPerson(auth: AuthDto): Promise<PersonResponseDto> {
    return this.repository.create({ ownerId: auth.user.id });
  }

  async reassignFaces(auth: AuthDto, personId: string, dto: AssetFaceUpdateDto): Promise<PersonResponseDto[]> {
    await this.access.requirePermission(auth, Permission.PERSON_WRITE, personId);
    const person = await this.findOrFail(personId);
    const result: PersonResponseDto[] = [];
    const changeFeaturePhoto: string[] = [];
    for (const data of dto.data) {
      const faces = await this.repository.getFacesByIds([{ personId: data.personId, assetId: data.assetId }]);

      for (const face of faces) {
        await this.access.requirePermission(auth, Permission.PERSON_CREATE, face.id);
        if (person.faceAssetId === null) {
          changeFeaturePhoto.push(person.id);
        }
        if (face.person && face.person.faceAssetId === face.id) {
          changeFeaturePhoto.push(face.person.id);
        }

        await this.repository.reassignFace(face.id, personId);
      }

      result.push(person);
    }
    if (changeFeaturePhoto.length > 0) {
      // Remove duplicates
      await this.createNewFeaturePhoto(Array.from(new Set(changeFeaturePhoto)));
    }
    return result;
  }

  async reassignFacesById(auth: AuthDto, personId: string, dto: FaceDto): Promise<PersonResponseDto> {
    await this.access.requirePermission(auth, Permission.PERSON_WRITE, personId);

    await this.access.requirePermission(auth, Permission.PERSON_CREATE, dto.id);
    const face = await this.repository.getFaceById(dto.id);
    const person = await this.findOrFail(personId);

    await this.repository.reassignFace(face.id, personId);
    if (person.faceAssetId === null) {
      await this.createNewFeaturePhoto([person.id]);
    }
    if (face.person && face.person.faceAssetId === face.id) {
      await this.createNewFeaturePhoto([face.person.id]);
    }

    return await this.findOrFail(personId).then(mapPerson);
  }

  async getFacesById(auth: AuthDto, dto: FaceDto): Promise<AssetFaceResponseDto[]> {
    await this.access.requirePermission(auth, Permission.ASSET_READ, dto.id);
    const faces = await this.repository.getFaces(dto.id);
    return faces.map((asset) => mapFaces(asset, auth));
  }

  async createNewFeaturePhoto(changeFeaturePhoto: string[]) {
    this.logger.debug(
      `Changing feature photos for ${changeFeaturePhoto.length} ${changeFeaturePhoto.length > 1 ? 'people' : 'person'}`,
    );
    for (const personId of changeFeaturePhoto) {
      const assetFace = await this.repository.getRandomFace(personId);

      if (assetFace !== null) {
        await this.repository.update({
          id: personId,
          faceAssetId: assetFace.id,
        });

        await this.jobRepository.queue({
          name: JobName.GENERATE_PERSON_THUMBNAIL,
          data: {
            id: personId,
          },
        });
      }
    }
  }

  async getById(auth: AuthDto, id: string): Promise<PersonResponseDto> {
    await this.access.requirePermission(auth, Permission.PERSON_READ, id);
    return this.findOrFail(id).then(mapPerson);
  }

  async getStatistics(auth: AuthDto, id: string): Promise<PersonStatisticsResponseDto> {
    await this.access.requirePermission(auth, Permission.PERSON_READ, id);
    return this.repository.getStatistics(id);
  }

  async getThumbnail(auth: AuthDto, id: string): Promise<ImmichFileResponse> {
    await this.access.requirePermission(auth, Permission.PERSON_READ, id);
    const person = await this.repository.getById(id);
    if (!person || !person.thumbnailPath) {
      throw new NotFoundException();
    }

    return new ImmichFileResponse({
      path: person.thumbnailPath,
      contentType: mimeTypes.lookup(person.thumbnailPath),
      cacheControl: true,
    });
  }

  async getAssets(auth: AuthDto, id: string): Promise<AssetResponseDto[]> {
    await this.access.requirePermission(auth, Permission.PERSON_READ, id);
    const assets = await this.repository.getAssets(id);
    return assets.map((asset) => mapAsset(asset));
  }

  async update(auth: AuthDto, id: string, dto: PersonUpdateDto): Promise<PersonResponseDto> {
    await this.access.requirePermission(auth, Permission.PERSON_WRITE, id);
    let person = await this.findOrFail(id);

    const { name, birthDate, isHidden, featureFaceAssetId: assetId } = dto;

    if (name !== undefined || birthDate !== undefined || isHidden !== undefined) {
      person = await this.repository.update({ id, name, birthDate, isHidden });
    }

    if (assetId) {
      await this.access.requirePermission(auth, Permission.ASSET_READ, assetId);
      const [face] = await this.repository.getFacesByIds([{ personId: id, assetId }]);
      if (!face) {
        throw new BadRequestException('Invalid assetId for feature face');
      }

      person = await this.repository.update({ id, faceAssetId: face.id });
      await this.jobRepository.queue({ name: JobName.GENERATE_PERSON_THUMBNAIL, data: { id } });
    }

    return mapPerson(person);
  }

  async updatePeople(auth: AuthDto, dto: PeopleUpdateDto): Promise<BulkIdResponseDto[]> {
    const results: BulkIdResponseDto[] = [];
    for (const person of dto.people) {
      try {
        await this.update(auth, person.id, {
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
      this.logger.debug(`Deleted ${people.length} people`);
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

    const relations = {
      exifInfo: true,
      faces: {
        person: true,
      },
    };
    const [asset] = await this.assetRepository.getByIds([id], relations);
    if (!asset || !asset.resizePath || asset.faces?.length > 0) {
      return false;
    }

    const faces = await this.machineLearningRepository.detectFaces(
      machineLearning.url,
      { imagePath: asset.resizePath },
      machineLearning.facialRecognition,
    );

    this.logger.debug(`${faces.length} faces detected in ${asset.resizePath}`);
    this.logger.verbose(faces.map((face) => ({ ...face, embedding: `vector(${face.embedding.length})` })));

    for (const { embedding, ...rest } of faces) {
      const matches = await this.smartInfoRepository.searchFaces({
        ownerId: asset.ownerId,
        embedding,
        numResults: 1,
        maxDistance: machineLearning.facialRecognition.maxDistance,
      });

      let personId = matches[0]?.personId || null;
      let newPerson: PersonEntity | null = null;
      if (!personId) {
        this.logger.debug('No matches, creating a new person.');
        newPerson = await this.repository.create({ ownerId: asset.ownerId });
        personId = newPerson.id;
      }

      const face = await this.repository.createFace({
        assetId: asset.id,
        personId,
        embedding,
        imageHeight: rest.imageHeight,
        imageWidth: rest.imageWidth,
        boundingBoxX1: rest.boundingBox.x1,
        boundingBoxX2: rest.boundingBox.x2,
        boundingBoxY1: rest.boundingBox.y1,
        boundingBoxY2: rest.boundingBox.y2,
      });

      if (newPerson) {
        await this.repository.update({ id: personId, faceAssetId: face.id });
        await this.jobRepository.queue({ name: JobName.GENERATE_PERSON_THUMBNAIL, data: { id: newPerson.id } });
      }
    }

    await this.assetRepository.upsertJobStatus({
      assetId: asset.id,
      facesRecognizedAt: new Date(),
    });

    return true;
  }

  async handlePersonMigration({ id }: IEntityJob) {
    const person = await this.repository.getById(id);
    if (!person) {
      return false;
    }

    await this.storageCore.movePersonFile(person, PersonPathType.FACE);

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

    const face = await this.repository.getFaceByIdWithAssets(person.faceAssetId);
    if (face === null) {
      return false;
    }

    const {
      assetId,
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
    this.logger.verbose(`Cropping face for person: ${person.id}`);
    const thumbnailPath = StorageCore.getPersonThumbnailPath(person);
    this.storageCore.ensureFolders(thumbnailPath);

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
    await this.repository.update({ id: person.id, thumbnailPath });

    return true;
  }

  async mergePerson(auth: AuthDto, id: string, dto: MergePersonDto): Promise<BulkIdResponseDto[]> {
    const mergeIds = dto.ids;
    await this.access.requirePermission(auth, Permission.PERSON_WRITE, id);
    const primaryPerson = await this.findOrFail(id);
    const primaryName = primaryPerson.name || primaryPerson.id;

    const results: BulkIdResponseDto[] = [];

    const allowedIds = await this.access.checkAccess(auth, Permission.PERSON_MERGE, mergeIds);

    for (const mergeId of mergeIds) {
      const hasAccess = allowedIds.has(mergeId);
      if (!hasAccess) {
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

        await this.repository.reassignFaces(mergeData);
        await this.jobRepository.queue({ name: JobName.PERSON_DELETE, data: { id: mergePerson.id } });

        this.logger.log(`Merged ${mergeName} into ${primaryName}`);
        results.push({ id: mergeId, success: true });
      } catch (error: Error | any) {
        this.logger.error(`Unable to merge ${mergeId} into ${id}: ${error}`, error?.stack);
        results.push({ id: mergeId, success: false, error: BulkIdErrorReason.UNKNOWN });
      }
    }

    return results;
  }

  private async findOrFail(id: string) {
    const person = await this.repository.getById(id);
    if (!person) {
      throw new BadRequestException('Person not found');
    }
    return person;
  }
}
