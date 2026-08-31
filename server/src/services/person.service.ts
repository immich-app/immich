import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Insertable, Selectable, Updateable } from 'kysely';
import { Person } from 'src/database';
import { Chunked, OnJob } from 'src/decorators';
import { BulkIdErrorReason, BulkIdResponseDto, BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  AssetFaceCreateDto,
  AssetFaceDeleteDto,
  AssetFaceResponseDto,
  AssetFaceUpdateDto,
  FaceDto,
  mapFaces,
  mapPerson,
  MergePersonDto,
  PeopleResponseDto,
  PeopleUpdateDto,
  PersonCreateDto,
  PersonResponseDto,
  PersonSearchDto,
  PersonStatisticsResponseDto,
  PersonUpdateDto,
} from 'src/dtos/person.dto';
import {
  AssetVisibility,
  CacheControl,
  JobName,
  JobStatus,
  Permission,
  PersonPathType,
  QueueName,
  SourceType,
  SystemMetadataKey,
  VectorIndex,
} from 'src/enum';
import { BoundingBox } from 'src/repositories/machine-learning.repository';
import { PersonId, UpdateFacesData } from 'src/repositories/person.repository';
import { AssetFaceTable } from 'src/schema/tables/asset-face.table';
import { FaceSearchTable } from 'src/schema/tables/face-search.table';
import { PersonTable } from 'src/schema/tables/person.table';
import { BaseService } from 'src/services/base.service';
import { JobItem, JobOf } from 'src/types';
import { getDimensions } from 'src/utils/asset.util';
import { ImmichFileResponse } from 'src/utils/file';
import { mimeTypes } from 'src/utils/mime-types';
import { batched, findOrFail, isFacialRecognitionEnabled } from 'src/utils/misc';
import { Point, transformPoints } from 'src/utils/transform';

const personKey = ({ ownerId, personGroupId }: PersonId) => `${ownerId}/${personGroupId}`;

@Injectable()
export class PersonService extends BaseService {
  async getAll(auth: AuthDto, dto: PersonSearchDto): Promise<PeopleResponseDto> {
    const { withHidden = false, closestAssetId, closestPersonId, page, size } = dto;
    let closestFaceAssetId = closestAssetId;
    const pagination = {
      take: size,
      skip: (page - 1) * size,
    };

    if (closestPersonId) {
      const person = await this.personRepository.getByGroupId({
        ownerId: auth.user.id,
        personGroupId: closestPersonId,
      });
      if (!person?.faceAssetId) {
        throw new NotFoundException('Person not found');
      }
      closestFaceAssetId = person.faceAssetId;
    }
    const { items, hasNextPage } = await this.personRepository.getAllForUser(pagination, auth.user.id, {
      withHidden,
      closestFaceAssetId,
    });
    const { total, hidden } = await this.personRepository.getNumberOfPeople(auth.user.id);

    return {
      people: items.map((person) => mapPerson(person)),
      hasNextPage,
      total,
      hidden,
    };
  }

  async reassignFaces(auth: AuthDto, personGroupId: string, dto: AssetFaceUpdateDto): Promise<PersonResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.PersonUpdate, ids: [personGroupId] });
    const person = await this.findOrFail(auth, personGroupId);
    const result: PersonResponseDto[] = [];
    const changeFeaturePhoto = new Map<string, PersonId>();
    for (const data of dto.data) {
      const faces = await this.personRepository.getFacesByIds(
        [{ personGroupId: data.personId, assetId: data.assetId }],
        { viewingUserId: auth.user.id },
      );

      for (const face of faces) {
        await this.requireAccess({ auth, permission: Permission.PersonCreate, ids: [face.id] });
        if (person.faceAssetId === null) {
          changeFeaturePhoto.set(personKey(person), person);
        }
        if (face.person && face.person.faceAssetId === face.id) {
          changeFeaturePhoto.set(personKey(face.person), face.person);
        }

        await this.personRepository.reassignFace(face.id, person.personGroupId);
      }

      result.push(mapPerson(person));
    }
    if (changeFeaturePhoto.size > 0) {
      await this.createNewFeaturePhoto(changeFeaturePhoto.values().toArray());
    }
    return result;
  }

  async reassignFacesById(auth: AuthDto, personGroupId: string, dto: FaceDto): Promise<PersonResponseDto> {
    await this.requireAccess({ auth, permission: Permission.PersonUpdate, ids: [personGroupId] });
    await this.requireAccess({ auth, permission: Permission.PersonCreate, ids: [dto.id] });
    const face = await this.personRepository.getFaceById(dto.id, { viewingUserId: auth.user.id });
    const person = await this.findOrFail(auth, personGroupId);

    await this.personRepository.reassignFace(face.id, person.personGroupId);
    if (person.faceAssetId === null) {
      await this.createNewFeaturePhoto([person]);
    }
    if (face.person && face.person.faceAssetId === face.id) {
      await this.createNewFeaturePhoto([face.person]);
    }

    return mapPerson(await this.findOrFail(auth, personGroupId));
  }

  async getFacesById(auth: AuthDto, dto: FaceDto): Promise<AssetFaceResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.AssetRead, ids: [dto.id] });
    const faces = await this.personRepository.getFaces(dto.id, { viewingUserId: auth.user.id, isVisible: true });
    const asset = await this.assetRepository.getForFaces(dto.id);
    const assetDimensions = getDimensions(asset);

    return faces.map((face) => mapFaces(face, auth, asset.edits, assetDimensions));
  }

  async createNewFeaturePhoto(changeFeaturePhoto: PersonId[]) {
    this.logger.debug(
      `Changing feature photos for ${changeFeaturePhoto.length} ${changeFeaturePhoto.length > 1 ? 'people' : 'person'}`,
    );

    const jobs: JobItem[] = [];
    for (const { ownerId, personGroupId } of changeFeaturePhoto) {
      const assetFace = await this.personRepository.getRandomFace(personGroupId);

      if (assetFace) {
        await this.personRepository.update({ ownerId, personGroupId, faceAssetId: assetFace.id });
        jobs.push({ name: JobName.PersonGenerateThumbnail, data: { ownerId, personGroupId } });
      }
    }

    await this.jobRepository.queueAll(jobs);
  }

  async getById(auth: AuthDto, personGroupId: string): Promise<PersonResponseDto> {
    await this.requireAccess({ auth, permission: Permission.PersonRead, ids: [personGroupId] });
    return mapPerson(await this.findOrFail(auth, personGroupId));
  }

  async getStatistics(auth: AuthDto, personGroupId: string): Promise<PersonStatisticsResponseDto> {
    await this.requireAccess({ auth, permission: Permission.PersonRead, ids: [personGroupId] });
    return this.personRepository.getStatistics(personGroupId, auth.user.id);
  }

  async getThumbnail(auth: AuthDto, personGroupId: string): Promise<ImmichFileResponse> {
    await this.requireAccess({ auth, permission: Permission.PersonRead, ids: [personGroupId] });
    const person = await this.personRepository.getByGroupId({ ownerId: auth.user.id, personGroupId });
    if (!person || !person.thumbnailPath) {
      throw new NotFoundException();
    }

    return new ImmichFileResponse({
      path: person.thumbnailPath,
      contentType: mimeTypes.lookup(person.thumbnailPath),
      cacheControl: CacheControl.PrivateWithoutCache,
    });
  }

  async create(auth: AuthDto, dto: PersonCreateDto): Promise<PersonResponseDto> {
    const group = await this.personRepository.createGroup(auth.user.id);
    const person = await this.personRepository.create({
      ownerId: auth.user.id,
      personGroupId: group.id,
      name: dto.name,
      birthDate: dto.birthDate,
      isHidden: dto.isHidden,
      isFavorite: dto.isFavorite,
      color: dto.color,
    });

    return mapPerson(person);
  }

  async update(auth: AuthDto, personGroupId: string, dto: PersonUpdateDto): Promise<PersonResponseDto> {
    await this.requireAccess({ auth, permission: Permission.PersonUpdate, ids: [personGroupId] });

    const { ownerId } = await this.findOrFail(auth, personGroupId);
    const { name, birthDate, isHidden, featureFaceAssetId: assetId, isFavorite, color } = dto;
    // TODO: set by faceId directly
    let faceId: string | undefined;
    if (assetId) {
      await this.requireAccess({ auth, permission: Permission.AssetRead, ids: [assetId] });
      const face = await this.personRepository.getForFeatureFaceUpdate({ personGroupId, assetId });
      if (!face) {
        throw new BadRequestException('Invalid assetId for feature face or asset is offline');
      }

      faceId = face.id;
    }

    const person = await this.personRepository.update({
      ownerId,
      personGroupId,
      faceAssetId: faceId,
      name,
      birthDate,
      isHidden,
      isFavorite,
      color,
    });

    if (assetId) {
      await this.jobRepository.queue({ name: JobName.PersonGenerateThumbnail, data: { ownerId, personGroupId } });
    }

    return mapPerson(person);
  }

  delete(auth: AuthDto, id: string): Promise<void> {
    return this.deleteAll(auth, { ids: [id] });
  }

  async updateAll(auth: AuthDto, dto: PeopleUpdateDto): Promise<BulkIdResponseDto[]> {
    const results: BulkIdResponseDto[] = [];
    for (const person of dto.people) {
      try {
        await this.update(auth, person.id, {
          isHidden: person.isHidden,
          name: person.name,
          birthDate: person.birthDate,
          featureFaceAssetId: person.featureFaceAssetId,
          isFavorite: person.isFavorite,
        });
        results.push({ id: person.id, success: true });
      } catch (error: Error | any) {
        this.logger.error(`Unable to update ${person.id} : ${error}`, error?.stack);
        results.push({ id: person.id, success: false, error: BulkIdErrorReason.UNKNOWN });
      }
    }
    return results;
  }

  async deleteAll(auth: AuthDto, { ids }: BulkIdsDto): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.PersonDelete, ids });
    await this.removeAllPersonGroups(ids, auth.user.id);
  }

  @Chunked()
  private async removeAllPersonGroups(groupIds: string[], ownerId?: string) {
    if (groupIds.length === 0) {
      return;
    }

    const people = await this.personRepository.delete(groupIds, ownerId);
    await Promise.all(people.map((person) => this.storageRepository.unlink(person.thumbnailPath)));
    await this.personRepository.deleteEmptyGroups();
    this.logger.debug(`Deleted ${groupIds.length} people`);
  }

  @OnJob({ name: JobName.PersonCleanup, queue: QueueName.BackgroundTask })
  async handlePersonCleanup(): Promise<JobStatus> {
    // each step can leave the next one something to clean up, so the order matters
    const people = await this.personRepository.getAllWithoutFaces();
    await this.removeAllPersonGroups(people.map((person) => person.personGroupId));

    const personGroups = await this.personRepository.deleteEmptyGroups();
    const clusterGroups = await this.personRepository.deleteOrphanedClusterGroups();

    this.logger.debug(`Deleted ${personGroups} empty person groups and ${clusterGroups} orphaned cluster groups`);

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.AssetDetectFacesQueueAll, queue: QueueName.FaceDetection })
  async handleQueueDetectFaces({ force }: JobOf<JobName.AssetDetectFacesQueueAll>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!isFacialRecognitionEnabled(machineLearning)) {
      return JobStatus.Skipped;
    }

    if (force) {
      await this.personRepository.deleteFaces({ sourceType: SourceType.MachineLearning });
      await this.handlePersonCleanup();
      await this.personRepository.vacuum({ reindexVectors: true });
    }

    for await (const assets of batched(this.assetJobRepository.streamForDetectFacesJob(force))) {
      await this.jobRepository.queueAll(
        assets.map((asset) => ({ name: JobName.AssetDetectFaces, data: { id: asset.id } })),
      );
    }

    if (force === undefined) {
      await this.jobRepository.queue({ name: JobName.PersonCleanup });
    }

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.AssetDetectFaces, queue: QueueName.FaceDetection })
  async handleDetectFaces({ id }: JobOf<JobName.AssetDetectFaces>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: true });
    if (!isFacialRecognitionEnabled(machineLearning)) {
      return JobStatus.Skipped;
    }

    const asset = await this.assetJobRepository.getForDetectFacesJob(id);
    const previewFile = asset?.files[0];
    if (!asset || asset.files.length !== 1 || !previewFile) {
      return JobStatus.Failed;
    }

    if (asset.visibility === AssetVisibility.Hidden) {
      return JobStatus.Skipped;
    }

    const { imageHeight, imageWidth, faces } = await this.machineLearningRepository.detectFaces(
      previewFile.path,
      machineLearning.facialRecognition,
    );
    this.logger.debug(`${faces.length} faces detected in ${previewFile.path}`);

    const facesToAdd: (Insertable<AssetFaceTable> & { id: string })[] = [];
    const embeddings: FaceSearchTable[] = [];
    const mlFaceIds = new Set<string>();

    for (const face of asset.faces) {
      if (face.sourceType === SourceType.MachineLearning) {
        mlFaceIds.add(face.id);
      }
    }

    const heightScale = imageHeight / (asset.faces[0]?.imageHeight || 1);
    const widthScale = imageWidth / (asset.faces[0]?.imageWidth || 1);
    for (const { boundingBox, embedding } of faces) {
      const scaledBox = {
        x1: boundingBox.x1 * widthScale,
        y1: boundingBox.y1 * heightScale,
        x2: boundingBox.x2 * widthScale,
        y2: boundingBox.y2 * heightScale,
      };
      const match = asset.faces.find((face) => this.iou(face, scaledBox) > 0.5);

      if (match && !mlFaceIds.delete(match.id)) {
        embeddings.push({ faceId: match.id, embedding });
      } else if (!match) {
        const faceId = this.cryptoRepository.randomUUID();
        facesToAdd.push({
          id: faceId,
          assetId: asset.id,
          imageHeight,
          imageWidth,
          boundingBoxX1: boundingBox.x1,
          boundingBoxY1: boundingBox.y1,
          boundingBoxX2: boundingBox.x2,
          boundingBoxY2: boundingBox.y2,
        });
        embeddings.push({ faceId, embedding });
      }
    }
    const faceIdsToRemove = [...mlFaceIds];

    if (facesToAdd.length > 0 || faceIdsToRemove.length > 0 || embeddings.length > 0) {
      await this.personRepository.refreshFaces(facesToAdd, faceIdsToRemove, embeddings);
    }

    if (faceIdsToRemove.length > 0) {
      this.logger.log(`Removed ${faceIdsToRemove.length} faces below detection threshold in asset ${id}`);
    }

    if (facesToAdd.length > 0) {
      this.logger.log(`Detected ${facesToAdd.length} new faces in asset ${id}`);
      const jobs = facesToAdd.map((face) => ({ name: JobName.FacialRecognition, data: { id: face.id } }) as const);
      await this.jobRepository.queueAll([{ name: JobName.FacialRecognitionQueueAll, data: { force: false } }, ...jobs]);
    } else if (embeddings.length > 0) {
      this.logger.log(`Added ${embeddings.length} face embeddings for asset ${id}`);
    }

    await this.assetRepository.upsertJobStatus({ assetId: asset.id, facesRecognizedAt: new Date() });

    return JobStatus.Success;
  }

  private iou(
    face: { boundingBoxX1: number; boundingBoxY1: number; boundingBoxX2: number; boundingBoxY2: number },
    newBox: BoundingBox,
  ): number {
    const x1 = Math.max(face.boundingBoxX1, newBox.x1);
    const y1 = Math.max(face.boundingBoxY1, newBox.y1);
    const x2 = Math.min(face.boundingBoxX2, newBox.x2);
    const y2 = Math.min(face.boundingBoxY2, newBox.y2);

    const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    const area1 = (face.boundingBoxX2 - face.boundingBoxX1) * (face.boundingBoxY2 - face.boundingBoxY1);
    const area2 = (newBox.x2 - newBox.x1) * (newBox.y2 - newBox.y1);
    const union = area1 + area2 - intersection;

    return intersection / union;
  }

  @OnJob({ name: JobName.FacialRecognitionQueueAll, queue: QueueName.FacialRecognition })
  async handleQueueRecognizeFaces({
    force,
    nightly,
    clusterGroupId,
  }: JobOf<JobName.FacialRecognitionQueueAll>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!isFacialRecognitionEnabled(machineLearning)) {
      return JobStatus.Skipped;
    }

    await this.jobRepository.waitForQueueCompletion(QueueName.ThumbnailGeneration, QueueName.FaceDetection);

    if (nightly) {
      const [state, latestFaceDate] = await Promise.all([
        this.systemMetadataRepository.get(SystemMetadataKey.FacialRecognitionState),
        this.personRepository.getLatestFaceDate(),
      ]);

      if (state?.lastRun && latestFaceDate && state.lastRun > latestFaceDate) {
        this.logger.debug('Skipping facial recognition nightly since no face has been added since the last run');
        return JobStatus.Skipped;
      }
    }

    const { waiting } = await this.jobRepository.getJobCounts(QueueName.FacialRecognition);

    if (force) {
      await this.personRepository.unassignFaces({ clusterGroupId, sourceType: SourceType.MachineLearning });
      await this.handlePersonCleanup();
      await this.personRepository.vacuum({ reindexVectors: false });
    } else if (waiting) {
      this.logger.debug(
        `Skipping facial recognition queueing because ${waiting} job${waiting > 1 ? 's are' : ' is'} already queued`,
      );
      return JobStatus.Skipped;
    }

    await this.databaseRepository.prewarm(VectorIndex.Face);

    const lastRun = new Date().toISOString();

    const faces = this.personRepository.getAllFaces(
      force
        ? { clusterGroupId, sourceType: clusterGroupId ? SourceType.MachineLearning : undefined }
        : { personGroupId: null, clusterGroupId, sourceType: SourceType.MachineLearning },
    );
    for await (const batch of batched(faces)) {
      await this.jobRepository.queueAll(
        batch.map((face) => ({ name: JobName.FacialRecognition, data: { id: face.id, deferred: false } })),
      );
    }

    await this.systemMetadataRepository.set(SystemMetadataKey.FacialRecognitionState, { lastRun });

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.FacialRecognition, queue: QueueName.FacialRecognition })
  async handleRecognizeFaces({ id, deferred }: JobOf<JobName.FacialRecognition>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: true });
    if (!isFacialRecognitionEnabled(machineLearning)) {
      return JobStatus.Skipped;
    }

    const face = await this.personRepository.getFaceForFacialRecognitionJob(id);
    if (!face || !face.asset) {
      this.logger.warn(`Face ${id} not found`);
      return JobStatus.Failed;
    }

    if (face.sourceType !== SourceType.MachineLearning) {
      this.logger.warn(`Skipping face ${id} due to source ${face.sourceType}`);
      return JobStatus.Skipped;
    }

    if (!face.faceSearch?.embedding) {
      this.logger.warn(`Face ${id} does not have an embedding`);
      return JobStatus.Failed;
    }

    if (face.personGroupId) {
      this.logger.debug(`Face ${id} already has a person assigned`);
      return JobStatus.Skipped;
    }

    const { ownerId, clusterGroupId } = face.asset;
    const matches = await this.searchRepository.searchFaces({
      clusterGroupId,
      embedding: face.faceSearch.embedding,
      maxDistance: machineLearning.facialRecognition.maxDistance,
      numResults: machineLearning.facialRecognition.minFaces,
      minBirthDate: new Date(face.asset.fileCreatedAt),
    });

    // `matches` also includes the face itself
    if (machineLearning.facialRecognition.minFaces > 1 && matches.length <= 1) {
      this.logger.debug(`Face ${id} only matched the face itself, skipping`);
      return JobStatus.Skipped;
    }

    this.logger.debug(`Face ${id} has ${matches.length} matches`);

    const isCore =
      matches.length >= machineLearning.facialRecognition.minFaces &&
      face.asset.visibility === AssetVisibility.Timeline;
    if (!isCore && !deferred) {
      this.logger.debug(`Deferring non-core face ${id} for later processing`);
      await this.jobRepository.queue({ name: JobName.FacialRecognition, data: { id, deferred: true } });
      return JobStatus.Skipped;
    }

    let personGroupId = matches.find((match) => match.personGroupId)?.personGroupId;
    if (!personGroupId) {
      const [matchWithPerson] = await this.searchRepository.searchFaces({
        clusterGroupId,
        embedding: face.faceSearch.embedding,
        maxDistance: machineLearning.facialRecognition.maxDistance,
        numResults: 1,
        hasPerson: true,
        minBirthDate: new Date(face.asset.fileCreatedAt),
      });

      personGroupId = matchWithPerson?.personGroupId ?? undefined;
    }

    if (!personGroupId && isCore) {
      const group = await this.personRepository.createGroup(ownerId);
      personGroupId = group.id;
      this.logger.log(`Created person group ${personGroupId} for face ${id}`);
    }

    if (personGroupId) {
      const person = await this.personRepository.getByGroupId({ ownerId, personGroupId });
      if (person) {
        this.logger.debug(`Face ${id} matched person ${person.personGroupId}`);
      } else {
        await this.personRepository.create({ ownerId, faceAssetId: face.id, personGroupId });
        this.logger.log(`Created person for face ${id} in group ${personGroupId}`);
        await this.jobRepository.queue({
          name: JobName.PersonGenerateThumbnail,
          data: { ownerId, personGroupId },
        });
      }

      this.logger.debug(`Assigning face ${id} to person group ${personGroupId}`);
      await this.personRepository.reassignFaces({ faceIds: [id], newPersonGroupId: personGroupId });
    }

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.PersonFileMigration, queue: QueueName.Migration })
  async handlePersonMigration({ ownerId, personGroupId }: JobOf<JobName.PersonFileMigration>): Promise<JobStatus> {
    const person = await this.personRepository.getByGroupId({ ownerId, personGroupId });
    if (!person) {
      return JobStatus.Failed;
    }

    await this.storageCore.movePersonFile(person, PersonPathType.Face);

    return JobStatus.Success;
  }

  async mergePerson(auth: AuthDto, personGroupId: string, dto: MergePersonDto): Promise<BulkIdResponseDto[]> {
    const mergeIds = dto.ids;
    if (mergeIds.includes(personGroupId)) {
      throw new BadRequestException('Cannot merge a person into themselves');
    }

    await this.requireAccess({ auth, permission: Permission.PersonUpdate, ids: [personGroupId] });

    const results: BulkIdResponseDto[] = [];

    const allowedIds = await this.checkAccess({
      auth,
      permission: Permission.PersonMerge,
      ids: mergeIds,
    });

    let primaryPerson: Selectable<PersonTable> | undefined;

    for (const mergePerson of await this.personRepository.getForMergePerson(mergeIds)) {
      const mergeId = mergePerson.personGroupId;
      const hasAccess = allowedIds.has(mergeId);
      if (!hasAccess) {
        results.push({ id: mergeId, success: false, error: BulkIdErrorReason.NO_PERMISSION });
        continue;
      }

      if (!primaryPerson || primaryPerson.ownerId !== mergePerson.ownerId) {
        primaryPerson = await this.personRepository.getByGroupId({ ownerId: mergePerson.ownerId, personGroupId });
        if (!primaryPerson) {
          continue;
        }
      }

      const changes: Updateable<Person> = {};
      if (!primaryPerson.name && mergePerson.name) {
        changes.name = mergePerson.name;
      }

      if (!primaryPerson.birthDate && mergePerson.birthDate) {
        changes.birthDate = mergePerson.birthDate;
      }

      if (
        (mergePerson.name && mergePerson.name !== primaryPerson.name) ||
        (mergePerson.birthDate && mergePerson.birthDate !== primaryPerson.birthDate)
      ) {
        continue;
      }

      if (Object.keys(changes).length > 0) {
        primaryPerson = await this.personRepository.update({
          ownerId: primaryPerson.ownerId,
          personGroupId: primaryPerson.personGroupId,
          ...changes,
        });
      }

      const mergeName = mergePerson.name || mergePerson.personGroupId;
      const mergeData: UpdateFacesData = {
        oldPersonGroupId: mergeId,
        newPersonGroupId: primaryPerson.personGroupId,
        ownerId: primaryPerson.ownerId,
      };
      this.logger.log(`Merging ${mergeName} into ${primaryPerson.name || primaryPerson.personGroupId}`);

      try {
        await this.personRepository.reassignFaces(mergeData);
        await this.removeAllPersonGroups([mergeId], primaryPerson.ownerId);

        this.logger.log(`Merged ${mergeName} into ${primaryPerson.name || primaryPerson.personGroupId}`);
        results.push({ id: mergeId, success: true });
      } catch (error: any) {
        this.logger.error(`Unable to merge ${mergeId} into ${personGroupId}: ${error}`, error?.stack);
        results.push({ id: mergeId, success: false, error: BulkIdErrorReason.UNKNOWN });
      }
    }
    return results;
  }

  private findOrFail(auth: AuthDto, personGroupId: string) {
    return findOrFail(() => this.personRepository.getByGroupId({ ownerId: auth.user.id, personGroupId }), 'Person');
  }

  // TODO return a asset face response
  async createFace(auth: AuthDto, dto: AssetFaceCreateDto): Promise<void> {
    await Promise.all([
      this.requireAccess({ auth, permission: Permission.AssetUpdate, ids: [dto.assetId] }),
      this.requireAccess({ auth, permission: Permission.PersonRead, ids: [dto.personId] }),
    ]);

    const [asset, person] = await Promise.all([
      this.assetRepository.getById(dto.assetId, { edits: true, exifInfo: true }),
      this.findOrFail(auth, dto.personId),
    ]);

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    const edits = asset.edits || [];

    let topLeft: Point = { x: dto.x, y: dto.y };
    let bottomRight: Point = { x: dto.x + dto.width, y: dto.y + dto.height };

    // the coordinates received from the client are based on the edited preview image
    // we need to convert them to the coordinate space of the original unedited image
    if (edits.length > 0) {
      if (!asset.width || !asset.height || !asset.exifInfo?.exifImageWidth || !asset.exifInfo?.exifImageHeight) {
        throw new BadRequestException('Asset does not have valid dimensions');
      }

      // convert from preview to full dimensions
      const scaleFactor = asset.width / dto.imageWidth;
      topLeft = { x: topLeft.x * scaleFactor, y: topLeft.y * scaleFactor };
      bottomRight = { x: bottomRight.x * scaleFactor, y: bottomRight.y * scaleFactor };

      const [invertedTopLeft, invertedBottomRight] = transformPoints(
        [topLeft, bottomRight],
        edits,
        { width: asset.width, height: asset.height },
        { inverse: true },
      ).points;

      // make sure topLeft is top-left and bottomRight is bottom-right
      topLeft = {
        x: Math.min(invertedTopLeft.x, invertedBottomRight.x),
        y: Math.min(invertedTopLeft.y, invertedBottomRight.y),
      };
      bottomRight = {
        x: Math.max(invertedTopLeft.x, invertedBottomRight.x),
        y: Math.max(invertedTopLeft.y, invertedBottomRight.y),
      };

      // now coordinates are in original image space
      const originalDimensions = getDimensions(asset.exifInfo);
      dto.imageWidth = originalDimensions.width;
      dto.imageHeight = originalDimensions.height;
    }

    await this.personRepository.createAssetFace({
      personGroupId: person.personGroupId,
      assetId: dto.assetId,
      imageHeight: dto.imageHeight,
      imageWidth: dto.imageWidth,
      boundingBoxX1: Math.round(topLeft.x),
      boundingBoxX2: Math.round(bottomRight.x),
      boundingBoxY1: Math.round(topLeft.y),
      boundingBoxY2: Math.round(bottomRight.y),
      sourceType: SourceType.Manual,
    });

    if (!person.faceAssetId) {
      await this.createNewFeaturePhoto([person]);
    }
  }

  async deleteFace(auth: AuthDto, id: string, dto: AssetFaceDeleteDto): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.FaceDelete, ids: [id] });

    return dto.force ? this.personRepository.deleteAssetFace(id) : this.personRepository.softDeleteAssetFaces(id);
  }
}
