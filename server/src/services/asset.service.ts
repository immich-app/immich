import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import _ from 'lodash';
import { DateTime, Duration } from 'luxon';
import { isAbsolute } from 'node:path';
import { JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import { AssetFile } from 'src/database';
import { OnJob } from 'src/decorators';
import { AssetResponseDto, SanitizedAssetResponseDto, mapAsset } from 'src/dtos/asset-response.dto';
import {
  AssetBulkDeleteDto,
  AssetBulkUpdateDto,
  AssetCopyDto,
  AssetJobName,
  AssetJobsDto,
  AssetMetadataBulkDeleteDto,
  AssetMetadataBulkResponseDto,
  AssetMetadataBulkUpsertDto,
  AssetMetadataResponseDto,
  AssetMetadataUpsertDto,
  AssetStatsDto,
  UpdateAssetDto,
  mapStats,
} from 'src/dtos/asset.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  AssetEditAction,
  AssetEditActionItem,
  AssetEditsCreateDto,
  AssetEditsResponseDto,
  TrimParameters,
} from 'src/dtos/editing.dto';
import { AssetOcrResponseDto } from 'src/dtos/ocr.dto';
import {
  AssetFileType,
  AssetStatus,
  AssetType,
  AssetVisibility,
  JobName,
  JobStatus,
  Permission,
  QueueName,
} from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { StorageService } from 'src/services/storage.service';
import { JobItem, JobOf } from 'src/types';
import { requireElevatedPermission } from 'src/utils/access';
import {
  getAssetFiles,
  getDimensions,
  isPanorama,
  onAfterUnlink,
  onBeforeLink,
  onBeforeUnlink,
} from 'src/utils/asset.util';
import { updateLockedColumns } from 'src/utils/database';
import { extractTimeZone } from 'src/utils/date';
import { formatSecondsToDuration, parseDurationToSeconds } from 'src/utils/duration';
import { transformOcrBoundingBox } from 'src/utils/transform';

@Injectable()
export class AssetService extends BaseService {
  async getStatistics(auth: AuthDto, dto: AssetStatsDto) {
    if (dto.visibility === AssetVisibility.Locked) {
      requireElevatedPermission(auth);
    }

    const stats = await this.assetRepository.getStatistics(auth.user.id, dto);
    return mapStats(stats);
  }

  async get(auth: AuthDto, id: string, spaceId?: string): Promise<AssetResponseDto | SanitizedAssetResponseDto> {
    await this.requireAccess({ auth, permission: Permission.AssetRead, ids: [id] });

    const asset = await this.assetRepository.getById(id, {
      exifInfo: true,
      owner: true,
      faces: { person: true },
      stack: { assets: true },
      edits: true,
      tags: true,
    });

    if (!asset) {
      throw new BadRequestException('Asset not found');
    }

    if (auth.sharedLink && !auth.sharedLink.showExif) {
      return mapAsset(asset, { stripMetadata: true, withStack: true, auth });
    }

    const data = mapAsset(asset, { withStack: true, auth });

    if (auth.sharedLink) {
      delete data.owner;
    }

    if (auth.sharedLink) {
      data.people = [];
      data.unassignedFaces = [];
    } else if (data.ownerId !== auth.user.id) {
      data.unassignedFaces = [];

      if (spaceId) {
        const member = await this.sharedSpaceRepository.getMember(spaceId, auth.user.id);
        if (!member) {
          throw new ForbiddenException('Not a member of this space');
        }

        const hasSpaceAccess = await this.accessRepository.asset.checkSpaceAccessForSpace(
          auth.user.id,
          spaceId,
          new Set([id]),
        );
        if (hasSpaceAccess.size === 0 || !data.people) {
          data.people = [];
        } else {
          const globalPersonIds = data.people.map((p) => p.id);
          const spacePersonMap = await this.sharedSpaceRepository.findSpacePersonsByLinkedPersonIds(
            spaceId,
            globalPersonIds,
          );
          for (const person of data.people) {
            const spacePerson = spacePersonMap.get(person.id);
            if (spacePerson) {
              person.spacePersonId = spacePerson.id;
            }
          }
          data.people = data.people.filter((p) => p.spacePersonId && !spacePersonMap.get(p.id)?.isHidden);
        }
      } else {
        // No spaceId — try to find a space containing this asset for this user
        const spaceForAsset = await this.sharedSpaceRepository.findSpaceForAssetAndUser(id, auth.user.id);
        if (spaceForAsset) {
          const globalPersonIds = (data.people || []).map((p) => p.id);
          const spacePersonMap = await this.sharedSpaceRepository.findSpacePersonsByLinkedPersonIds(
            spaceForAsset.spaceId,
            globalPersonIds,
          );
          for (const person of data.people || []) {
            const spacePerson = spacePersonMap.get(person.id);
            if (spacePerson) {
              person.spacePersonId = spacePerson.id;
            }
          }
          data.people = (data.people || []).filter((p) => p.spacePersonId && !spacePersonMap.get(p.id)?.isHidden);
          data.resolvedSpaceId = spaceForAsset.spaceId;
        } else {
          data.people = [];
        }
      }
    }

    return data;
  }

  async update(auth: AuthDto, id: string, dto: UpdateAssetDto): Promise<AssetResponseDto> {
    await this.requireAccess({ auth, permission: Permission.AssetUpdate, ids: [id] });

    const { description, dateTimeOriginal, latitude, longitude, rating, ...rest } = dto;
    const repos = { asset: this.assetRepository, event: this.eventRepository };

    let previousMotion: { id: string } | null = null;
    if (rest.livePhotoVideoId) {
      await onBeforeLink(repos, { userId: auth.user.id, livePhotoVideoId: rest.livePhotoVideoId });
    } else if (rest.livePhotoVideoId === null) {
      const asset = await this.findOrFail(id);
      if (asset.livePhotoVideoId) {
        previousMotion = await onBeforeUnlink(repos, { livePhotoVideoId: asset.livePhotoVideoId });
      }
    }

    await this.updateExif({ id, description, dateTimeOriginal, latitude, longitude, rating });

    const asset = await this.assetRepository.update({ id, ...rest });

    if (previousMotion && asset) {
      await onAfterUnlink(repos, {
        userId: auth.user.id,
        livePhotoVideoId: previousMotion.id,
        visibility: asset.visibility,
      });
    }

    if (!asset) {
      throw new BadRequestException('Asset not found');
    }

    return mapAsset(asset, { auth });
  }

  async updateAll(auth: AuthDto, dto: AssetBulkUpdateDto): Promise<void> {
    const {
      ids,
      isFavorite,
      visibility,
      dateTimeOriginal,
      latitude,
      longitude,
      rating,
      description,
      duplicateId,
      dateTimeRelative,
      timeZone,
    } = dto;
    await this.requireAccess({ auth, permission: Permission.AssetUpdate, ids });

    const assetDto = _.omitBy({ isFavorite, visibility, duplicateId }, _.isUndefined);

    // When latitude/longitude are updated in bulk, reverse-geocode once so country/state/city
    // stay in sync across all selected assets. See updateExif() for the rationale.
    let geo: { country: string | null; state: string | null; city: string | null } | undefined;
    if (latitude !== undefined && longitude !== undefined) {
      geo = await this.mapRepository.reverseGeocode({ latitude, longitude });
    }

    const exifDto = _.omitBy(
      {
        latitude,
        longitude,
        rating,
        description,
        dateTimeOriginal,
        ...geo,
      },
      _.isUndefined,
    );

    if (Object.keys(exifDto).length > 0) {
      await this.assetRepository.updateAllExif(ids, exifDto);
    }

    const extractedTimeZone = extractTimeZone(dateTimeOriginal);

    if (
      (dateTimeRelative !== undefined && dateTimeRelative !== 0) ||
      timeZone !== undefined ||
      extractedTimeZone?.type === 'fixed'
    ) {
      await this.assetRepository.updateDateTimeOriginal(ids, dateTimeRelative, timeZone ?? extractedTimeZone?.name);
    }

    if (Object.keys(assetDto).length > 0) {
      await this.assetRepository.updateAll(ids, assetDto);
    }

    if (visibility === AssetVisibility.Locked) {
      await this.albumRepository.removeAssetsFromAll(ids);
    }

    await this.jobRepository.queueAll(ids.map((id) => ({ name: JobName.SidecarWrite, data: { id } })));
  }

  async copy(
    auth: AuthDto,
    {
      sourceId,
      targetId,
      albums = true,
      sidecar = true,
      sharedLinks = true,
      stack = true,
      favorite = true,
    }: AssetCopyDto,
  ) {
    await this.requireAccess({ auth, permission: Permission.AssetCopy, ids: [sourceId, targetId] });
    const sourceAsset = await this.assetRepository.getForCopy(sourceId);
    const targetAsset = await this.assetRepository.getForCopy(targetId);

    if (!sourceAsset || !targetAsset) {
      throw new BadRequestException('Both assets must exist');
    }

    if (sourceId === targetId) {
      throw new BadRequestException('Source and target id must be distinct');
    }

    if (albums) {
      await this.albumRepository.copyAlbums({ sourceAssetId: sourceId, targetAssetId: targetId });
    }

    if (sharedLinks) {
      await this.sharedLinkAssetRepository.copySharedLinks({ sourceAssetId: sourceId, targetAssetId: targetId });
    }

    if (stack) {
      await this.copyStack({ sourceAsset, targetAsset });
    }

    if (favorite) {
      await this.assetRepository.update({ id: targetId, isFavorite: sourceAsset.isFavorite });
    }

    if (sidecar) {
      await this.copySidecar({ sourceAsset, targetAsset });
    }
  }

  private async copyStack({
    sourceAsset,
    targetAsset,
  }: {
    sourceAsset: { id: string; stackId: string | null };
    targetAsset: { id: string; stackId: string | null };
  }) {
    if (!sourceAsset.stackId) {
      return;
    }

    if (targetAsset.stackId) {
      await this.stackRepository.merge({ sourceId: sourceAsset.stackId, targetId: targetAsset.stackId });
      await this.stackRepository.delete(sourceAsset.stackId);
    } else {
      await this.assetRepository.update({ id: targetAsset.id, stackId: sourceAsset.stackId });
    }
  }

  private async copySidecar({
    sourceAsset,
    targetAsset,
  }: {
    sourceAsset: { files: AssetFile[] };
    targetAsset: { id: string; files: AssetFile[]; originalPath: string };
  }) {
    const { sidecarFile: sourceFile } = getAssetFiles(sourceAsset.files);
    if (!sourceFile?.path) {
      return;
    }

    // Safe-by-invariant: AssetService.copy rejects sourceId === targetId, so distinct
    // assets guarantee sourceFile.path !== targetSidecarPath.
    const targetSidecarPath = `${targetAsset.originalPath}.xmp`;

    const { localPath, cleanup } = await this.ensureLocalFile(sourceFile.path);
    try {
      if (isAbsolute(targetSidecarPath)) {
        this.storageCore.ensureFolders(targetSidecarPath);
        await this.storageRepository.copyFile(localPath, targetSidecarPath);
      } else {
        const backend = StorageService.resolveBackendForKey(targetSidecarPath);
        const stream = this.storageRepository.createPlainReadStream(localPath);
        await backend.put(targetSidecarPath, stream, { contentType: 'application/xml' });
      }
    } finally {
      await cleanup();
    }

    await this.assetRepository.upsertFile({
      assetId: targetAsset.id,
      path: targetSidecarPath,
      type: AssetFileType.Sidecar,
    });
    await this.jobRepository.queue({ name: JobName.AssetExtractMetadata, data: { id: targetAsset.id } });
  }

  @OnJob({ name: JobName.AssetDeleteCheck, queue: QueueName.BackgroundTask })
  async handleAssetDeletionCheck(): Promise<JobStatus> {
    const config = await this.getConfig({ withCache: false });
    const trashedDays = config.trash.enabled ? config.trash.days : 0;
    const trashedBefore = DateTime.now()
      .minus(Duration.fromObject({ days: trashedDays }))
      .toJSDate();

    let chunk: Array<{ id: string; isOffline: boolean }> = [];
    const queueChunk = async () => {
      if (chunk.length > 0) {
        await this.jobRepository.queueAll(
          chunk.map(({ id, isOffline }) => ({
            name: JobName.AssetDelete,
            data: { id, deleteOnDisk: !isOffline },
          })),
        );
        chunk = [];
      }
    };

    const assets = this.assetJobRepository.streamForDeletedJob(trashedBefore);
    for await (const asset of assets) {
      chunk.push(asset);
      if (chunk.length >= JOBS_ASSET_PAGINATION_SIZE) {
        await queueChunk();
      }
    }

    await queueChunk();

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.AssetDelete, queue: QueueName.BackgroundTask })
  async handleAssetDeletion(job: JobOf<JobName.AssetDelete>): Promise<JobStatus> {
    const { id, deleteOnDisk } = job;

    const asset = await this.assetJobRepository.getForAssetDeletion(id);

    if (!asset) {
      return JobStatus.Failed;
    }

    // replace the parent of the stack children with a new asset
    if (asset.stack?.primaryAssetId === id) {
      // this only includes timeline visible assets and excludes the primary asset
      const stackAssetIds = asset.stack.assets.map((a) => a.id);
      if (stackAssetIds.length >= 2) {
        const newPrimaryAssetId = stackAssetIds.find((a) => a !== id)!;
        await this.stackRepository.update(asset.stack.id, {
          id: asset.stack.id,
          primaryAssetId: newPrimaryAssetId,
        });
      } else {
        await this.stackRepository.delete(asset.stack.id);
      }
    }

    await this.assetRepository.remove(asset);
    if (!asset.libraryId) {
      await this.userRepository.updateUsage(asset.ownerId, -(asset.exifInfo?.fileSizeInByte || 0));
    }

    await this.eventRepository.emit('AssetDelete', { assetId: id, userId: asset.ownerId });

    // delete the motion if it is not used by another asset
    if (asset.livePhotoVideoId) {
      const count = await this.assetRepository.getLivePhotoCount(asset.livePhotoVideoId);
      if (count === 0) {
        await this.jobRepository.queue({
          name: JobName.AssetDelete,
          data: { id: asset.livePhotoVideoId, deleteOnDisk },
        });
      }
    }

    const assetFiles = getAssetFiles(asset.files ?? []);
    const files = [
      assetFiles.thumbnailFile?.path,
      assetFiles.previewFile?.path,
      assetFiles.fullsizeFile?.path,
      assetFiles.editedFullsizeFile?.path,
      assetFiles.editedPreviewFile?.path,
      assetFiles.editedThumbnailFile?.path,
      assetFiles.encodedVideoFile?.path,
    ];

    if (deleteOnDisk && !asset.isOffline) {
      files.push(assetFiles.sidecarFile?.path, asset.originalPath);
    }

    await this.jobRepository.queue({ name: JobName.FileDelete, data: { files: files.filter(Boolean) } });

    return JobStatus.Success;
  }

  async deleteAll(auth: AuthDto, dto: AssetBulkDeleteDto): Promise<void> {
    const { ids, force } = dto;

    await this.requireAccess({ auth, permission: Permission.AssetDelete, ids });
    await this.assetRepository.updateAll(ids, {
      deletedAt: new Date(),
      status: force ? AssetStatus.Deleted : AssetStatus.Trashed,
    });
    await this.eventRepository.emit(force ? 'AssetDeleteAll' : 'AssetTrashAll', {
      assetIds: ids,
      userId: auth.user.id,
    });
  }

  async getMetadata(auth: AuthDto, id: string): Promise<AssetMetadataResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.AssetRead, ids: [id] });
    return this.assetRepository.getMetadata(id);
  }

  async getOcr(auth: AuthDto, id: string): Promise<AssetOcrResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.AssetRead, ids: [id] });
    const ocr = await this.ocrRepository.getByAssetId(id);
    const asset = await this.assetRepository.getForOcr(id);

    if (!asset) {
      throw new BadRequestException('Asset not found');
    }

    const dimensions = getDimensions({
      exifImageHeight: asset.exifImageHeight,
      exifImageWidth: asset.exifImageWidth,
      orientation: asset.orientation,
    });

    return ocr.map((item) => transformOcrBoundingBox(item, asset.edits, dimensions));
  }

  async upsertBulkMetadata(auth: AuthDto, dto: AssetMetadataBulkUpsertDto): Promise<AssetMetadataBulkResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.AssetUpdate, ids: dto.items.map((item) => item.assetId) });

    const uniqueKeys = new Set<string>();
    for (const item of dto.items) {
      const key = `(${item.assetId}, ${item.key})`;
      if (uniqueKeys.has(key)) {
        throw new BadRequestException(`Duplicate items are not allowed: "${key}"`);
      }

      uniqueKeys.add(key);
    }

    return this.assetRepository.upsertBulkMetadata(dto.items);
  }

  async upsertMetadata(auth: AuthDto, id: string, dto: AssetMetadataUpsertDto): Promise<AssetMetadataResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.AssetUpdate, ids: [id] });

    const uniqueKeys = new Set<string>();
    for (const { key } of dto.items) {
      if (uniqueKeys.has(key)) {
        throw new BadRequestException(`Duplicate items are not allowed: "${key}"`);
      }

      uniqueKeys.add(key);
    }

    return this.assetRepository.upsertMetadata(id, dto.items);
  }

  async getMetadataByKey(auth: AuthDto, id: string, key: string): Promise<AssetMetadataResponseDto> {
    await this.requireAccess({ auth, permission: Permission.AssetRead, ids: [id] });

    const item = await this.assetRepository.getMetadataByKey(id, key);
    if (!item) {
      throw new BadRequestException(`Metadata with key "${key}" not found for asset with id "${id}"`);
    }
    return item;
  }

  async deleteMetadataByKey(auth: AuthDto, id: string, key: string): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.AssetUpdate, ids: [id] });
    return this.assetRepository.deleteMetadataByKey(id, key);
  }

  async deleteBulkMetadata(auth: AuthDto, dto: AssetMetadataBulkDeleteDto) {
    await this.requireAccess({ auth, permission: Permission.AssetUpdate, ids: dto.items.map((item) => item.assetId) });
    await this.assetRepository.deleteBulkMetadata(dto.items);
  }

  async run(auth: AuthDto, dto: AssetJobsDto) {
    await this.requireAccess({ auth, permission: Permission.AssetUpdate, ids: dto.assetIds });

    const jobs: JobItem[] = [];

    for (const id of dto.assetIds) {
      switch (dto.name) {
        case AssetJobName.REFRESH_FACES: {
          jobs.push({ name: JobName.AssetDetectFaces, data: { id } });
          break;
        }

        case AssetJobName.REFRESH_METADATA: {
          jobs.push({ name: JobName.AssetExtractMetadata, data: { id } });
          break;
        }

        case AssetJobName.REGENERATE_THUMBNAIL: {
          jobs.push({ name: JobName.AssetGenerateThumbnails, data: { id } });
          break;
        }

        case AssetJobName.TRANSCODE_VIDEO: {
          jobs.push({ name: JobName.AssetEncodeVideo, data: { id } });
          break;
        }
      }
    }

    await this.jobRepository.queueAll(jobs);
  }

  private async findOrFail(id: string) {
    const asset = await this.assetRepository.getById(id);
    if (!asset) {
      throw new BadRequestException('Asset not found');
    }
    return asset;
  }

  private async updateExif(dto: {
    id: string;
    description?: string;
    dateTimeOriginal?: string;
    latitude?: number;
    longitude?: number;
    rating?: number | null;
  }) {
    const { id, description, dateTimeOriginal, latitude, longitude, rating } = dto;

    // When latitude/longitude are updated manually, reverse-geocode them so country/state/city
    // stay in sync. Otherwise the asset shows on the map (which only needs lat/lon) but is
    // missing from location-based filters and search (which scope by country/city).
    let geo: { country: string | null; state: string | null; city: string | null } | undefined;
    if (latitude !== undefined && longitude !== undefined) {
      geo = await this.mapRepository.reverseGeocode({ latitude, longitude });
    }

    const writes = _.omitBy(
      {
        description,
        dateTimeOriginal,
        timeZone: extractTimeZone(dateTimeOriginal)?.name,
        latitude,
        longitude,
        rating,
        ...geo,
      },
      _.isUndefined,
    );

    if (Object.keys(writes).length > 0) {
      await this.assetRepository.upsertExif(
        updateLockedColumns({
          assetId: id,
          ...writes,
        }),
        { lockedPropertiesBehavior: 'append' },
      );
      await this.jobRepository.queue({ name: JobName.SidecarWrite, data: { id } });
    }
  }

  async getAssetEdits(auth: AuthDto, id: string): Promise<AssetEditsResponseDto> {
    await this.requireAccess({ auth, permission: Permission.AssetRead, ids: [id] });
    const edits = await this.assetEditRepository.getAll(id);

    return {
      assetId: id,
      edits,
    };
  }

  async editAsset(auth: AuthDto, id: string, dto: AssetEditsCreateDto): Promise<AssetEditsResponseDto> {
    await this.requireAccess({ auth, permission: Permission.AssetEditCreate, ids: [id] });

    const asset = await this.assetRepository.getForEdit(id);
    if (!asset) {
      throw new BadRequestException('Asset not found');
    }

    const edits = dto.edits as AssetEditActionItem[];
    const hasTrim = edits.some((e) => e.action === AssetEditAction.Trim);
    const hasSpatial = edits.some((e) =>
      [AssetEditAction.Crop, AssetEditAction.Rotate, AssetEditAction.Mirror].includes(e.action),
    );

    // Reject mixed spatial + trim edits
    if (hasTrim && hasSpatial) {
      throw new BadRequestException('Cannot combine trim with spatial edits');
    }

    if (hasTrim) {
      // Video trim validation
      if (asset.type !== AssetType.Video) {
        throw new BadRequestException('Trim is only supported for video assets');
      }

      if (asset.livePhotoVideoId) {
        throw new BadRequestException('Trimming live photos is not supported');
      }

      // S3/cloud storage check
      if (!StorageCore.isImmichPath(asset.originalPath)) {
        throw new BadRequestException('Video trimming is not available for cloud-stored videos');
      }

      // Audio-only file check
      const probeResult = await this.mediaRepository.probe(asset.originalPath);
      if (!probeResult.videoStreams || probeResult.videoStreams.length === 0) {
        throw new BadRequestException('Cannot trim audio-only files');
      }

      // When re-trimming, asset.duration reflects the previous trim.
      // Use originalDuration from the existing trim edit if available.
      const existingEdits = await this.assetEditRepository.getAll(id);
      const existingTrim = existingEdits.find((e) => e.action === AssetEditAction.Trim);
      const existingOriginalDuration = existingTrim
        ? (existingTrim.parameters as TrimParameters & { originalDuration?: number }).originalDuration
        : undefined;

      const durationSeconds = existingOriginalDuration ?? parseDurationToSeconds(asset.duration);
      if (durationSeconds === null || durationSeconds <= 0) {
        throw new BadRequestException('Video duration is not available');
      }

      // Very short video check (against original duration)
      if (durationSeconds < 2) {
        throw new BadRequestException('Video is too short to trim (minimum 2 seconds)');
      }

      const trim = edits.find((e) => e.action === AssetEditAction.Trim)!;
      const { startTime, endTime } = trim.parameters as TrimParameters;

      if (endTime > durationSeconds) {
        throw new BadRequestException('End time exceeds video duration');
      }

      if (startTime === 0 && endTime >= durationSeconds && !existingTrim) {
        throw new BadRequestException('Trim must actually remove content');
      }

      // Enrich with originalDuration before storing (preserve original, not current trimmed)
      (trim.parameters as TrimParameters & { originalDuration: number }).originalDuration = durationSeconds;
    } else {
      // Existing image validation
      if (asset.type !== AssetType.Image) {
        throw new BadRequestException('Only images can be edited');
      }

      if (asset.livePhotoVideoId) {
        throw new BadRequestException('Editing live photos is not supported');
      }

      if (isPanorama(asset)) {
        throw new BadRequestException('Editing panorama images is not supported');
      }

      if (asset.originalPath?.toLowerCase().endsWith('.gif')) {
        throw new BadRequestException('Editing GIF images is not supported');
      }

      if (asset.originalPath?.toLowerCase().endsWith('.svg')) {
        throw new BadRequestException('Editing SVG images is not supported');
      }

      // Crop bounds validation
      const { width: assetWidth, height: assetHeight } = getDimensions(asset);
      if (!assetWidth || !assetHeight) {
        throw new BadRequestException('Asset dimensions are not available for editing');
      }

      const crop = edits.find((e) => e.action === AssetEditAction.Crop);
      if (crop) {
        if (edits[0].action !== AssetEditAction.Crop) {
          throw new BadRequestException('Crop action must be the first edit action');
        }

        const { x, y, width, height } = crop.parameters;
        if (x + width > assetWidth || y + height > assetHeight) {
          throw new BadRequestException('Crop parameters are out of bounds');
        }
      }
    }

    const newEdits = await this.assetEditRepository.replaceAll(id, edits);
    await this.jobRepository.queue({ name: JobName.AssetEditThumbnailGeneration, data: { id } });

    return {
      assetId: id,
      edits: newEdits,
    };
  }

  async removeAssetEdits(auth: AuthDto, id: string): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.AssetEditDelete, ids: [id] });

    const asset = await this.assetRepository.getById(id);
    if (!asset) {
      throw new BadRequestException('Asset not found');
    }

    // Read existing edits to check for trim (need originalDuration for restore)
    const existingEdits = await this.assetEditRepository.getAll(id);
    const trimEdit = existingEdits.find((e) => e.action === AssetEditAction.Trim);
    if (trimEdit) {
      const params = trimEdit.parameters as TrimParameters & { originalDuration?: number };
      if (params.originalDuration) {
        const restoredDuration = formatSecondsToDuration(params.originalDuration);
        await this.assetRepository.update({ id, duration: restoredDuration });
      }
    }

    await this.assetEditRepository.replaceAll(id, []);
    await this.jobRepository.queue({ name: JobName.AssetEditThumbnailGeneration, data: { id } });
  }
}
