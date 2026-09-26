import { Injectable } from '@nestjs/common';
import { constants } from 'node:fs';
import { basename, dirname, extname, isAbsolute, join, parse, relative, resolve, sep } from 'node:path';
import sanitize from 'sanitize-filename';
import { StorageCore } from 'src/cores/storage.core';
import { OnEvent, OnJob } from 'src/decorators';
import {
  AssetFileType,
  AssetPathType,
  AssetStatus,
  AssetType,
  AssetVisibility,
  DatabaseLock,
  ImmichWorker,
  JobName,
  JobStatus,
  QueueName,
} from 'src/enum';
import { AssetRepository } from 'src/repositories/asset.repository';
import { ArgOf } from 'src/repositories/event.repository';
import { BaseService } from 'src/services/base.service';
import { JobOf } from 'src/types';
import { handlePromiseError } from 'src/utils/misc';

export const IPHONE_UPLOAD_ENV = 'IMMICH_IPHONE_UPLOAD';

const SWEEP_CRON_NAME = 'IphoneUploadSweep';
const SWEEP_CRON_EXPRESSION = '0 * * * *';
const SWEEP_MIN_AGE_MS = 60 * 60 * 1000;
const TMP_SUFFIX = '.immich-tmp';
const MAX_NAME_ATTEMPTS = 1000;

type IphoneUploadTarget = { userId: string; libraryId: string; folder: string };
type AdoptableAsset = NonNullable<Awaited<ReturnType<AssetRepository['getForIphoneUpload']>>>;
type PlacedFile = { path: string; movedBytes: number };

export const parseIphoneUploadConfig = (value?: string) => {
  const entries: Array<{ email: string; folder: string }> = [];
  const invalid: string[] = [];

  for (const raw of (value ?? '').split(';')) {
    const entry = raw.trim();
    if (!entry) {
      continue;
    }

    const index = entry.indexOf('=');
    const email = entry.slice(0, Math.max(0, index)).trim();
    const folder = entry.slice(index + 1).trim();
    if (index <= 0 || !email || !folder) {
      invalid.push(entry);
      continue;
    }

    entries.push({ email, folder });
  }

  return { entries, invalid };
};

const isInside = (child: string, parent: string) => {
  const path = relative(resolve(parent), resolve(child));
  return path === '' || (path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path));
};

// localDateTime holds the local capture time expressed in UTC
const toMonthFolder = (date: Date) =>
  `${date.getUTCFullYear()}_${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

// hidden and with an unsupported extension, so neither the library scan nor the watcher picks it up
const toTmpPath = (finalPath: string) => join(dirname(finalPath), `.${basename(finalPath)}${TMP_SUFFIX}`);

const fromTmpPath = (path: string) => {
  const name = basename(path);
  if (!name.startsWith('.') || !name.endsWith(TMP_SUFFIX)) {
    return null;
  }
  return join(dirname(path), name.slice(1, -TMP_SUFFIX.length));
};

const getExtension = (asset: AdoptableAsset) =>
  sanitize(extname(asset.originalFileName) || extname(asset.originalPath));

const getBaseName = (asset: AdoptableAsset) => sanitize(parse(asset.originalFileName).name).trim() || asset.id;

/**
 * Moves each upload of the configured users into their `iphone_upload/YYYY_MM` folder and turns the same asset
 * into an asset of the external library covering that folder. Keeping the id and the content checksum means the
 * mobile app still sees the asset as backed up.
 */
@Injectable()
export class IphoneUploadService extends BaseService {
  private targets?: Map<string, IphoneUploadTarget>;

  private isEnabled() {
    return !!process.env[IPHONE_UPLOAD_ENV]?.trim();
  }

  @OnEvent({ name: 'ConfigInit', workers: [ImmichWorker.Microservices] })
  async onConfigInit() {
    if (!this.isEnabled()) {
      return;
    }

    await this.getTargets({ refresh: true, announce: true });

    // only one microservices instance runs the sweep
    const lock = await this.databaseRepository.tryLock(DatabaseLock.IphoneUpload);
    if (!lock) {
      return;
    }

    this.cronRepository.create({
      name: SWEEP_CRON_NAME,
      expression: SWEEP_CRON_EXPRESSION,
      onTick: () => handlePromiseError(this.sweep(), this.logger),
      start: true,
    });
  }

  @OnEvent({ name: 'JobSuccess', workers: [ImmichWorker.Microservices] })
  async onJobSuccess({ job, response }: ArgOf<'JobSuccess'>) {
    if (!this.isEnabled() || (response !== JobStatus.Success && response !== JobStatus.Skipped)) {
      return;
    }

    let isVideoStep: boolean;
    if (job.name === JobName.AssetGenerateThumbnails) {
      isVideoStep = false;
    } else if (job.name === JobName.AssetEncodeVideo) {
      isVideoStep = true;
    } else {
      return;
    }

    if (job.data.source !== 'upload') {
      return;
    }

    // an error here would make the job service skip the follow-up jobs of this asset
    try {
      const asset = await this.assetRepository.getForIphoneUpload(job.data.id);
      if (!asset || asset.libraryId) {
        return;
      }

      // the original is no longer read once thumbnails exist (images) or transcoding is done (videos)
      if ((asset.type === AssetType.Video) !== isVideoStep) {
        return;
      }

      const targets = await this.getTargets();
      if (!targets.has(asset.ownerId)) {
        return;
      }

      await this.jobRepository.queue({ name: JobName.IphoneUploadAdopt, data: { id: asset.id } });
    } catch (error) {
      this.logger.error(`Unable to queue iPhone upload move for asset ${job.data.id}: ${error}`);
    }
  }

  async sweep() {
    const targets = await this.getTargets({ refresh: true });
    const ids = await this.assetRepository.getIphoneUploadCandidateIds(
      [...targets.keys()],
      new Date(Date.now() - SWEEP_MIN_AGE_MS),
    );

    if (ids.length === 0) {
      return;
    }

    this.logger.log(`Queueing ${ids.length} upload(s) to move to their iPhone upload folder`);
    await this.jobRepository.queueAll(ids.map((id) => ({ name: JobName.IphoneUploadAdopt, data: { id } })));
  }

  // runs on the storage template queue, one job at a time, so it never races a storage template move
  @OnJob({ name: JobName.IphoneUploadAdopt, queue: QueueName.StorageTemplateMigration })
  async handleAdopt({ id }: JobOf<JobName.IphoneUploadAdopt>): Promise<JobStatus> {
    const { storageTemplate } = await this.getConfig({ withCache: true });
    if (!storageTemplate.hashVerificationEnabled) {
      this.logger.warn(`Not moving asset ${id}: storage template hash verification is disabled`);
      return JobStatus.Skipped;
    }

    let asset = await this.assetRepository.getForIphoneUpload(id);
    if (asset?.visibility === AssetVisibility.Hidden) {
      // the video part of a Live Photo moves together with its still
      const stillId = await this.assetRepository.getLivePhotoStillId(asset.id);
      asset = stillId ? await this.assetRepository.getForIphoneUpload(stillId) : undefined;
    }

    if (
      !asset ||
      asset.libraryId ||
      asset.deletedAt ||
      asset.visibility === AssetVisibility.Locked ||
      asset.visibility === AssetVisibility.Hidden
    ) {
      return JobStatus.Skipped;
    }

    const target = (await this.getTargets()).get(asset.ownerId);
    if (!target) {
      return JobStatus.Skipped;
    }

    const duplicate = await this.assetRepository.getByChecksum({
      ownerId: asset.ownerId,
      libraryId: target.libraryId,
      checksum: asset.checksum,
    });
    if (duplicate) {
      return this.trashDuplicate(asset, duplicate.id);
    }

    const video = await this.getPendingLivePhotoVideo(asset, target);

    const still = await this.placeFile(asset, target, { extraExtensions: video ? [getExtension(video)] : [] });
    if (!still) {
      return JobStatus.Failed;
    }

    let movedBytes = still.movedBytes;

    if (video) {
      const placed = await this.placeFile(video, target, { stillPath: still.path });
      if (!placed) {
        // the still stays out of the library, so the next sweep retries both
        return JobStatus.Failed;
      }

      await this.assetRepository.update({
        id: video.id,
        originalPath: placed.path,
        libraryId: target.libraryId,
        isExternal: true,
      });
      movedBytes += placed.movedBytes;
    }

    await this.assetRepository.update({
      id: asset.id,
      originalPath: still.path,
      libraryId: target.libraryId,
      isExternal: true,
    });

    const sidecar = asset.files.find((file) => file.type === AssetFileType.Sidecar);
    if (sidecar && StorageCore.isImmichPath(sidecar.path)) {
      await this.storageCore.moveFile({
        entityId: asset.id,
        pathType: AssetFileType.Sidecar,
        oldPath: sidecar.path,
        newPath: `${still.path}.xmp`,
      });
    }

    if (movedBytes > 0) {
      await this.userRepository.updateUsage(asset.ownerId, -movedBytes);
    }

    this.logger.log(`Moved upload ${asset.id} to ${still.path}`);

    return JobStatus.Success;
  }

  private async getPendingLivePhotoVideo(asset: AdoptableAsset, target: IphoneUploadTarget) {
    if (!asset.livePhotoVideoId) {
      return;
    }

    const video = await this.assetRepository.getForIphoneUpload(asset.livePhotoVideoId);
    if (!video || video.libraryId || video.ownerId !== asset.ownerId) {
      return;
    }

    const duplicate = await this.assetRepository.getByChecksum({
      ownerId: video.ownerId,
      libraryId: target.libraryId,
      checksum: video.checksum,
    });
    if (duplicate) {
      this.logger.warn(`Leaving Live Photo video ${video.id} in place, its content is already in the library`);
      return;
    }

    return video;
  }

  private async trashDuplicate(asset: AdoptableAsset, duplicateId: string) {
    const ids = [asset.id];
    if (asset.livePhotoVideoId) {
      ids.push(asset.livePhotoVideoId);
    }

    this.logger.log(`Upload ${asset.id} is already in the library as ${duplicateId}, moving the upload to the trash`);
    await this.assetRepository.updateAll(ids, { deletedAt: new Date(), status: AssetStatus.Trashed });
    await this.eventRepository.emit('AssetTrashAll', { assetIds: ids, userId: asset.ownerId });

    return JobStatus.Success;
  }

  private async placeFile(
    asset: AdoptableAsset,
    target: IphoneUploadTarget,
    options: { stillPath?: string; extraExtensions?: string[] },
  ): Promise<PlacedFile | null> {
    const { originalPath } = asset;

    if (!StorageCore.isImmichPath(originalPath)) {
      return this.resumePlaceFile(asset, target);
    }

    const extension = getExtension(asset);
    const folder = options.stillPath
      ? dirname(options.stillPath)
      : join(target.folder, toMonthFolder(new Date(asset.localDateTime)));
    const name = options.stillPath ? parse(options.stillPath).name : getBaseName(asset);
    const finalPath = await this.findFreePath(folder, name, [extension, ...(options.extraExtensions ?? [])]);
    const tmpPath = toTmpPath(finalPath);

    const { size } = await this.storageRepository.stat(originalPath);

    // crash safe (move_history) and verifies the checksum when copying across file systems
    await this.storageCore.moveFile({
      entityId: asset.id,
      pathType: AssetPathType.Original,
      oldPath: originalPath,
      newPath: tmpPath,
      assetInfo: { sizeInBytes: size, checksum: asset.checksum },
    });

    const moved = await this.assetRepository.getForIphoneUpload(asset.id);
    if (moved?.originalPath !== tmpPath) {
      this.logger.warn(`Could not move ${originalPath} of asset ${asset.id} to ${tmpPath}, will retry later`);
      return null;
    }

    await this.storageRepository.rename(tmpPath, finalPath);

    return { path: finalPath, movedBytes: size };
  }

  /** finishes an adoption interrupted after the file left the Immich storage */
  private async resumePlaceFile(asset: AdoptableAsset, target: IphoneUploadTarget): Promise<PlacedFile | null> {
    const { originalPath } = asset;
    if (!isInside(originalPath, target.folder)) {
      this.logger.error(`Upload ${asset.id} is at ${originalPath}, outside of ${target.folder}, not moving it`);
      return null;
    }

    const finalPath = fromTmpPath(originalPath) ?? originalPath;
    const [isTmpPresent, isFinalPresent] = await Promise.all([
      finalPath === originalPath ? false : this.storageRepository.checkFileExists(originalPath),
      this.storageRepository.checkFileExists(finalPath),
    ]);

    if (isTmpPresent && isFinalPresent) {
      this.logger.error(`Cannot resume move of asset ${asset.id}: both ${originalPath} and ${finalPath} exist`);
      return null;
    }

    if (isTmpPresent) {
      await this.storageRepository.rename(originalPath, finalPath);
    } else if (!isFinalPresent) {
      this.logger.error(`Cannot resume move of asset ${asset.id}: ${finalPath} not found`);
      return null;
    }

    this.logger.log(`Resumed interrupted move of asset ${asset.id} to ${finalPath}`);
    return { path: finalPath, movedBytes: 0 };
  }

  private async findFreePath(folder: string, name: string, extensions: string[]) {
    for (let attempt = 0; attempt < MAX_NAME_ATTEMPTS; attempt++) {
      const base = join(folder, attempt === 0 ? name : `${name}_${attempt}`);
      const candidates = extensions.flatMap((extension) => [`${base}${extension}`, toTmpPath(`${base}${extension}`)]);
      const taken = await Promise.all(candidates.map((path) => this.storageRepository.checkFileExists(path)));
      if (!taken.includes(true)) {
        return `${base}${extensions[0]}`;
      }
    }

    throw new Error(`No free file name for ${name} in ${folder}`);
  }

  private async getTargets({ refresh = false, announce = false } = {}) {
    if (this.targets && !refresh) {
      return this.targets;
    }

    const targets = new Map<string, IphoneUploadTarget>();
    const { entries, invalid } = parseIphoneUploadConfig(process.env[IPHONE_UPLOAD_ENV]);

    for (const entry of invalid) {
      this.logger.error(`Ignoring invalid ${IPHONE_UPLOAD_ENV} entry "${entry}", expected email=/absolute/path`);
    }

    if (entries.length > 0) {
      const libraries = await this.libraryRepository.getAll(false);
      for (const { email, folder } of entries) {
        const result = await this.resolveTarget(email, folder, libraries);
        if (typeof result === 'string') {
          this.logger.error(`Ignoring ${IPHONE_UPLOAD_ENV} entry for ${email}: ${result}`);
          continue;
        }

        targets.set(result.userId, result);
        if (announce) {
          this.logger.log(`Uploads of ${email} will be moved to ${result.folder} (library ${result.libraryId})`);
        }
      }
    }

    this.targets = targets;
    return targets;
  }

  private async resolveTarget(
    email: string,
    rawFolder: string,
    libraries: Array<{ id: string; ownerId: string; importPaths: string[] }>,
  ): Promise<IphoneUploadTarget | string> {
    if (!isAbsolute(rawFolder)) {
      return `${rawFolder} must be an absolute path`;
    }

    const folder = resolve(rawFolder);
    if (StorageCore.isImmichPath(folder)) {
      return `${folder} is inside the Immich media location`;
    }

    const user =
      (await this.userRepository.getByEmail(email)) ?? (await this.userRepository.getByEmail(email.toLowerCase()));
    if (!user) {
      return 'user not found';
    }

    const library = libraries.find(
      (library) =>
        library.ownerId === user.id && library.importPaths.some((importPath) => isInside(folder, importPath)),
    );
    if (!library) {
      return `no external library owned by this user has an import path containing ${folder}`;
    }

    if (!(await this.storageRepository.checkFileExists(folder, constants.W_OK))) {
      return `${folder} does not exist or is not writable`;
    }

    return { userId: user.id, libraryId: library.id, folder };
  }
}
