import { BadRequestException, Injectable } from '@nestjs/common';
import _ from 'lodash';
import { DateTime, Duration } from 'luxon';
import { pipeline } from 'node:stream/promises';
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
import { AssetEditAction, AssetEditActionItem, AssetEditsCreateDto, AssetEditsResponseDto } from 'src/dtos/editing.dto';
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
import { batched, findOrFail } from 'src/utils/misc';
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

  async get(auth: AuthDto, id: string): Promise<AssetResponseDto | SanitizedAssetResponseDto> {
    await this.requireAccess({ auth, permission: Permission.AssetRead, ids: [id] });

    const asset = await this.assetRepository.getById(id, {
      exifInfo: true,
      owner: true,
      faces: { person: true, viewingUserId: auth.user.id },
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

    return this.get(auth, id) as Promise<AssetResponseDto>;
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
    const exifDto = _.omitBy(
      {
        latitude,
        longitude,
        rating,
        description,
        dateTimeOriginal,
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
      this.logger.debug(
        `[DEK] updateAll locking ${ids.length} asset(s) for user ${auth.user.id}; auth.session=${auth.session ? auth.session.id : 'none'}, rawToken present=${!!auth.session?.rawToken}`,
      );
      await this.albumRepository.removeAssetsFromAll(ids);
      await this.encryptLockedAssets(auth, ids);
    } else if (visibility !== undefined) {
      this.logger.debug(
        `[DEK] updateAll changing visibility of ${ids.length} asset(s) to ${visibility} for user ${auth.user.id}; checking for previously-encrypted assets to decrypt`,
      );
      await this.decryptUnlockedAssets(auth, ids);
    }

    await this.jobRepository.queueAll(ids.map((id) => ({ name: JobName.SidecarWrite, data: { id } })));
  }

  /**
   * Encrypts the original file, at rest, for assets newly moved into the Locked Folder. Best-effort: if the
   * current session has no DEK available (e.g. an OAuth-only user, or a session that predates this feature), the
   * assets are simply left unencrypted, exactly as Locked Folder behaved before this feature existed — this
   * never blocks the visibility change itself. Already-encrypted assets (re-locking, duplicate calls) are
   * skipped.
   *
   * Deliberately run synchronously with this request, not as a background job: this is the only place a
   * plaintext DEK is reliably available for an asset that isn't brand new — see `resolveSessionDek` — a job
   * processor has no user session to derive one from. By the time an asset is being locked, its thumbnails,
   * preview, and metadata have normally already been generated while it was a plain Timeline asset, so nothing
   * else needs to read the now-encrypted original afterwards. See `getForGenerateThumbnailJob`,
   * `getForMetadataExtraction`, and `getForVideoConversion` guards for what happens if a reprocessing job is
   * triggered for an asset that got encrypted after those derivatives were already made.
   */
  private async encryptLockedAssets(auth: AuthDto, ids: string[]): Promise<void> {
    const dek = await this.resolveSessionDek(auth);
    if (!dek) {
      this.logger.debug('[DEK] Skipping locked-asset encryption: no DEK available for this session');
      return;
    }

    this.logger.debug(
      `[DEK] Resolved session DEK, attempting to encrypt ${ids.length} locked asset(s): ${ids.join(', ')}`,
    );

    const assets = await this.assetRepository.getByIds(ids);
    this.logger.debug(
      `[DEK] Fetched ${assets.length} asset row(s) for encryption out of ${ids.length} requested id(s)`,
    );
    for (const asset of assets) {
      if (asset.encryptionNonce) {
        this.logger.debug(`[DEK] Asset ${asset.id} is already encrypted (nonce present), skipping`);
        continue;
      }

      this.logger.debug(`[DEK] Encrypting asset ${asset.id} at originalPath=${asset.originalPath}`);
      try {
        const { nonce, authTag } = await this.encryptOriginalFile(asset.originalPath, dek);
        await this.assetRepository.update({ id: asset.id, encryptionNonce: nonce, encryptionAuthTag: authTag });
        this.logger.debug(`[DEK] Successfully encrypted and persisted nonce/authTag for asset ${asset.id}`);
      } catch (error: any) {
        this.logger.error(`[DEK] Failed to encrypt locked asset ${asset.id} at rest: ${error}`, error?.stack);
      }

      const assetFiles = await this.assetFileRepository.search({
        assetId: asset.id,
      });

      for (const assetFile of assetFiles) {
        this.logger.debug(`[DEK]     Encrypting ${assetFile.type} at path=${assetFile.path}`);

        try {
          const { nonce, authTag } = await this.encryptOriginalFile(assetFile.path, dek);
          await this.assetFileRepository.update({
            id: assetFile.id,
            encryptionNonce: nonce,
            encryptionAuthTag: authTag,
          });
          this.logger.debug(`[DEK]     Successfully encrypted and persisted nonce/authTag for ${assetFile.type}`);
        } catch (error: any) {
          this.logger.error(`[DEK]     Failed to encrypt thumbnail: ${error}`, error?.stack);
        }
      }
    }
  }

  /** Encrypts `originalPath` in place with `dek`, returning the base64 nonce/auth tag needed to decrypt it later. */
  private async encryptOriginalFile(originalPath: string, dek: Buffer): Promise<{ nonce: string; authTag: string }> {
    const { nonce, cipher } = this.cryptoRepository.createEncryptStream(dek);
    const tmpPath = `${originalPath}.encrypting`;

    this.logger.debug(`[DEK] Streaming ${originalPath} -> ${tmpPath} through AES-256-GCM cipher`);

    await pipeline(
      this.storageRepository.createPlainReadStream(originalPath),
      cipher,
      this.storageRepository.createWriteStream(tmpPath),
    );

    const authTag = cipher.getAuthTag();
    await this.storageRepository.rename(tmpPath, originalPath);

    this.logger.debug(
      `[DEK] Encrypted file written and renamed back to ${originalPath} (authTag length=${authTag.length})`,
    );

    return { nonce: nonce.toString('base64'), authTag: authTag.toString('base64') };
  }

  /**
   * Decrypts the original file, at rest, for assets moved out of the Locked Folder (to Timeline, Archive, or
   * Hidden). Mirrors `encryptLockedAssets`: best-effort, never blocks the visibility change. If the current
   * session has no DEK available, the asset is left encrypted on disk even though its visibility has changed —
   * see the design doc's known-limitations section. Assets that aren't currently encrypted are skipped.
   */
  private async decryptUnlockedAssets(auth: AuthDto, ids: string[]): Promise<void> {
    const assets = await this.assetRepository.getByIds(ids);
    const encryptedAssets = assets.filter((asset) => asset.encryptionNonce);
    if (encryptedAssets.length === 0) {
      this.logger.debug('[DEK] No previously-encrypted assets among the ones being unlocked, nothing to decrypt');
      return;
    }

    const dek = await this.resolveSessionDek(auth);
    if (!dek) {
      this.logger.warn(
        `[DEK] Cannot decrypt ${encryptedAssets.length} asset(s) being moved out of Locked Folder: no DEK available for this session — file(s) will remain encrypted at rest despite the visibility change`,
      );
      return;
    }

    this.logger.debug(`[DEK] Resolved session DEK, attempting to decrypt ${encryptedAssets.length} unlocked asset(s)`);

    for (const asset of encryptedAssets) {
      if (!asset.encryptionNonce || !asset.encryptionAuthTag) {
        continue;
      }

      this.logger.debug(`[DEK] Decrypting asset ${asset.id} at originalPath=${asset.originalPath}`);
      try {
        await this.decryptOriginalFile(
          asset.originalPath,
          dek,
          Buffer.from(asset.encryptionNonce, 'base64'),
          Buffer.from(asset.encryptionAuthTag, 'base64'),
        );
        await this.assetRepository.update({ id: asset.id, encryptionNonce: null, encryptionAuthTag: null });
        this.logger.debug(`[DEK] Successfully decrypted and cleared nonce/authTag for asset ${asset.id}`);
      } catch (error: any) {
        this.logger.error(`[DEK] Failed to decrypt unlocked asset ${asset.id} at rest: ${error}`, error?.stack);
      }

      const assetFiles = await this.assetFileRepository.search({
        assetId: asset.id,
      });

      for (const assetFile of assetFiles) {
        if (!assetFile.encryptionNonce || !assetFile.encryptionAuthTag) {
          continue;
        }

        this.logger.debug(`[DEK]     Decrypting ${assetFile.type} at path=${assetFile.path}`);

        try {
          await this.decryptOriginalFile(
            assetFile.path,
            dek,
            Buffer.from(assetFile.encryptionNonce, 'base64'),
            Buffer.from(assetFile.encryptionAuthTag, 'base64'),
          );
          await this.assetFileRepository.update({ id: assetFile.id, encryptionNonce: null, encryptionAuthTag: null });
          this.logger.debug(
            `[DEK]     Successfully decrypted and cleared nonce/authTag for assetFile: ${assetFile.type}`,
          );
        } catch (error: any) {
          this.logger.error(`[DEK]     Failed to decrypt unlocked asset ${asset.id} at rest: ${error}`, error?.stack);
        }
      }
    }
  }

  /** Decrypts `originalPath` in place with `dek`/`nonce`/`authTag`, the inverse of `encryptOriginalFile`. */
  private async decryptOriginalFile(originalPath: string, dek: Buffer, nonce: Buffer, authTag: Buffer): Promise<void> {
    const decipher = this.cryptoRepository.createDecryptStream(dek, nonce, authTag);
    const tmpPath = `${originalPath}.decrypting`;

    this.logger.debug(`[DEK] Streaming ${originalPath} -> ${tmpPath} through AES-256-GCM decipher`);

    await pipeline(
      this.storageRepository.createPlainReadStream(originalPath),
      decipher,
      this.storageRepository.createWriteStream(tmpPath),
    );

    await this.storageRepository.rename(tmpPath, originalPath);

    this.logger.debug(`[DEK] Decrypted file written and renamed back to ${originalPath}`);
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

    const { sidecarFile: targetFile } = getAssetFiles(targetAsset.files ?? []);
    if (targetFile?.path) {
      await this.storageRepository.unlink(targetFile.path);
    }

    await this.storageRepository.copyFile(sourceFile.path, `${targetAsset.originalPath}.xmp`);
    await this.assetRepository.upsertFile({
      assetId: targetAsset.id,
      path: `${targetAsset.originalPath}.xmp`,
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

    for await (const assets of batched(this.assetJobRepository.streamForDeletedJob(trashedBefore))) {
      await this.jobRepository.queueAll(
        assets.map(({ id, isOffline }) => ({ name: JobName.AssetDelete, data: { id, deleteOnDisk: !isOffline } })),
      );
    }

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.AssetDelete, queue: QueueName.BackgroundTask })
  async handleAssetDeletion(job: JobOf<JobName.AssetDelete>): Promise<JobStatus> {
    const { id, deleteOnDisk } = job;

    const asset = await this.assetJobRepository.getForAssetDeletion(id);

    if (!asset) {
      return JobStatus.Failed;
    }

    if (asset.stack) {
      // asset.stack.assets only includes timeline visible assets and excludes the primary asset
      const remainingStackAssetIds = asset.stack.assets.map((a) => a.id).filter((assetId) => assetId !== id);

      // the primary survives unless it is the asset being deleted
      let remainingCount = remainingStackAssetIds.length;
      if (asset.stack.primaryAssetId !== id) {
        remainingCount++;
      }

      if (remainingCount < 2) {
        // 0 or 1 asset would remain: dissolve the stack so it does not linger as a single-asset stack
        await this.stackRepository.delete(asset.stack.id);
      } else if (asset.stack.primaryAssetId === id) {
        // the primary is being deleted but others remain: promote a new primary
        await this.stackRepository.update(asset.stack.id, {
          id: asset.stack.id,
          primaryAssetId: remainingStackAssetIds[0],
        });
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

  private findOrFail(id: string) {
    return findOrFail(() => this.assetRepository.getById(id), 'Asset');
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
    const writes = _.omitBy(
      {
        description,
        dateTimeOriginal,
        timeZone: extractTimeZone(dateTimeOriginal)?.name,
        latitude,
        longitude,
        rating,
      },
      _.isUndefined,
    );

    if (Object.keys(writes).length > 0) {
      await this.assetRepository.upsertExif({
        exif: updateLockedColumns({
          assetId: id,
          ...writes,
        }),
        lockedPropertiesBehavior: 'append',
      });
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

    // check that crop parameters will not go out of bounds
    const { width: assetWidth, height: assetHeight } = getDimensions(asset);

    if (!assetWidth || !assetHeight) {
      throw new BadRequestException('Asset dimensions are not available for editing');
    }

    const edits = dto.edits as AssetEditActionItem[];
    const crop = edits.find((e) => e.action === AssetEditAction.Crop);
    if (crop) {
      if (edits[0].action !== AssetEditAction.Crop) {
        throw new BadRequestException('Crop action must be the first edit action');
      }

      // check that crop parameters will not go out of bounds
      const { width: assetWidth, height: assetHeight } = getDimensions(asset);

      if (!assetWidth || !assetHeight) {
        throw new BadRequestException('Asset dimensions are not available for editing');
      }

      const { x, y, width, height } = crop.parameters;
      if (x + width > assetWidth || y + height > assetHeight) {
        throw new BadRequestException('Crop parameters are out of bounds');
      }
    }

    const newEdits = await this.assetEditRepository.replaceAll(id, edits);
    await this.jobRepository.queue({ name: JobName.AssetEditThumbnailGeneration, data: { id } });

    // Return the asset and its applied edits
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

    await this.assetEditRepository.replaceAll(id, []);
    await this.jobRepository.queue({ name: JobName.AssetEditThumbnailGeneration, data: { id } });
  }
}
