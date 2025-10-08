import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Response } from 'express';
import { DateTime } from 'luxon';
import { createHash } from 'node:crypto';
import { extname, join } from 'node:path';
import { Readable } from 'node:stream';
import { JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import { OnEvent, OnJob } from 'src/decorators';
import { GetUploadStatusDto, ResumeUploadDto, StartUploadDto } from 'src/dtos/asset-upload';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  AssetMetadataKey,
  AssetStatus,
  AssetType,
  AssetVisibility,
  ImmichWorker,
  JobName,
  JobStatus,
  QueueName,
  StorageFolder,
} from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { BaseService } from 'src/services/base.service';
import { JobItem, JobOf } from 'src/types';
import { isAssetChecksumConstraint } from 'src/utils/database';
import { mimeTypes } from 'src/utils/mime-types';
import { withRetry } from 'src/utils/misc';

export const MAX_RUFH_INTEROP_VERSION = 8;

@Injectable()
export class AssetUploadService extends BaseService {
  // This is used to proactively abort previous requests for the same asset
  // when a new one arrives. The previous request still holds the asset lock
  // and will prevent the new request from proceeding until the previous one
  // times out. As normal client behavior will not have concurrent requests,
  // we can assume the previous request has already failed on the client end.
  private activeRequests = new Map<string, { req: Readable; startTime: Date }>();

  @OnEvent({ name: 'UploadAbort', workers: [ImmichWorker.Api] })
  onUploadAbort({ assetId, abortTime }: ArgOf<'UploadAbort'>) {
    const entry = this.activeRequests.get(assetId);
    if (entry && abortTime > entry.startTime) {
      this.activeRequests.delete(assetId);
      entry.req.destroy();
      return true;
    }
    return false;
  }

  async startUpload(auth: AuthDto, req: Readable, res: Response, dto: StartUploadDto): Promise<void> {
    this.logger.verboseFn(() => `Starting upload: ${JSON.stringify(dto)}`);
    const { isComplete, assetData, uploadLength, contentLength, version } = dto;

    const asset = await this.onStart(auth, dto);
    if (asset.isDuplicate) {
      if (asset.status !== AssetStatus.Partial) {
        return this.sendAlreadyCompleted(res);
      }

      const location = `/api/upload/${asset.id}`;
      if (version <= MAX_RUFH_INTEROP_VERSION) {
        this.sendInterimResponse(res, location, version);
      }
      // this is a 5xx to indicate the client should do offset retrieval and resume
      res.status(500).send('Incomplete asset already exists');
      return;
    }

    if (isComplete && uploadLength !== contentLength) {
      return this.sendInconsistentLength(res);
    }

    const location = `/api/upload/${asset.id}`;
    if (version <= MAX_RUFH_INTEROP_VERSION) {
      this.sendInterimResponse(res, location, version);
    }

    this.addRequest(asset.id, req);
    let checksumBuffer: Buffer | undefined;
    const writeStream = this.storageRepository.createOrAppendWriteStream(asset.path);
    if (isComplete) {
      const hash = createHash('sha1');
      req.on('data', (data: Buffer) => hash.update(data));
      writeStream.on('finish', () => (checksumBuffer = hash.digest()));
    }
    req.pipe(writeStream);
    await new Promise((resolve, reject) => writeStream.on('finish', resolve).on('close', reject));
    this.setCompleteHeader(res, dto.version, isComplete);
    if (!isComplete) {
      res.status(201).set('Location', location).setHeader('Upload-Limit', 'min-size=0').send();
      return;
    }
    this.logger.log(`Finished upload to ${asset.path}`);
    if (dto.checksum.compare(checksumBuffer!) !== 0) {
      return await this.sendChecksumMismatch(res, asset.id, asset.path);
    }

    await this.onComplete({ id: asset.id, path: asset.path, fileModifiedAt: assetData.fileModifiedAt });
    res.status(200).send({ id: asset.id });
  }

  resumeUpload(auth: AuthDto, req: Readable, res: Response, id: string, dto: ResumeUploadDto): Promise<void> {
    this.logger.verboseFn(() => `Resuming upload for ${id}: ${JSON.stringify(dto)}`);
    const { isComplete, uploadLength, uploadOffset, contentLength, version } = dto;
    this.setCompleteHeader(res, version, false);
    this.addRequest(id, req);
    return this.databaseRepository.withUuidLock(id, async () => {
      const completionData = await this.assetRepository.getCompletionMetadata(id, auth.user.id);
      if (!completionData) {
        res.status(404).send('Asset not found');
        return;
      }
      const { fileModifiedAt, path, status, checksum: providedChecksum, size } = completionData;

      if (status !== AssetStatus.Partial) {
        return this.sendAlreadyCompleted(res);
      }

      if (uploadLength && size && size !== uploadLength) {
        return this.sendInconsistentLength(res);
      }

      const expectedOffset = await this.getCurrentOffset(path);
      if (expectedOffset !== uploadOffset) {
        return this.sendOffsetMismatch(res, expectedOffset, uploadOffset);
      }

      const newLength = uploadOffset + contentLength;
      if (uploadLength !== undefined && newLength > uploadLength) {
        res.status(400).send('Upload would exceed declared length');
        return;
      }

      if (contentLength === 0 && !isComplete) {
        res.status(204).setHeader('Upload-Offset', expectedOffset.toString()).send();
        return;
      }

      const writeStream = this.storageRepository.createOrAppendWriteStream(path);
      req.pipe(writeStream);
      await new Promise((resolve, reject) => writeStream.on('finish', resolve).on('close', reject));
      this.setCompleteHeader(res, version, isComplete);
      if (!isComplete) {
        try {
          const offset = await this.getCurrentOffset(path);
          res.status(204).setHeader('Upload-Offset', offset.toString()).send();
        } catch {
          this.logger.error(`Failed to get current offset for ${path} after write`);
          res.status(500).send();
        }
        return;
      }

      this.logger.log(`Finished upload to ${path}`);
      const checksum = await this.cryptoRepository.hashFile(path);
      if (providedChecksum.compare(checksum) !== 0) {
        return await this.sendChecksumMismatch(res, id, path);
      }

      await this.onComplete({ id, path, fileModifiedAt });
      res.status(200).send({ id });
    });
  }

  cancelUpload(auth: AuthDto, assetId: string, res: Response): Promise<void> {
    this.abortExistingRequest(assetId);
    return this.databaseRepository.withUuidLock(assetId, async () => {
      const asset = await this.assetRepository.getCompletionMetadata(assetId, auth.user.id);
      if (!asset) {
        res.status(404).send('Asset not found');
        return;
      }
      if (asset.status !== AssetStatus.Partial) {
        return this.sendAlreadyCompleted(res);
      }
      await this.onCancel(assetId, asset.path);
      res.status(204).send();
    });
  }

  async getUploadStatus(auth: AuthDto, res: Response, id: string, { version }: GetUploadStatusDto): Promise<void> {
    this.logger.verboseFn(() => `Getting upload status for ${id} with version ${version}`);
    this.abortExistingRequest(id);
    return this.databaseRepository.withUuidLock(id, async () => {
      const asset = await this.assetRepository.getCompletionMetadata(id, auth.user.id);
      if (!asset) {
        res.status(404).send('Asset not found');
        return;
      }

      const offset = await this.getCurrentOffset(asset.path);
      this.setCompleteHeader(res, version, asset.status !== AssetStatus.Partial);
      res
        .status(204)
        .setHeader('Upload-Offset', offset.toString())
        .setHeader('Cache-Control', 'no-store')
        .setHeader('Upload-Limit', 'min-size=0')
        .send();
    });
  }

  @OnJob({ name: JobName.PartialAssetCleanupQueueAll, queue: QueueName.BackgroundTask })
  async removeStaleUploads(): Promise<void> {
    // TODO: make this configurable
    const createdBefore = DateTime.now().minus({ days: 7 }).toJSDate();
    let jobs: JobItem[] = [];
    const assets = this.assetJobRepository.streamForPartialAssetCleanupJob(createdBefore);
    for await (const asset of assets) {
      jobs.push({ name: JobName.PartialAssetCleanup, data: asset });
      if (jobs.length >= JOBS_ASSET_PAGINATION_SIZE) {
        await this.jobRepository.queueAll(jobs);
        jobs = [];
      }
    }
    await this.jobRepository.queueAll(jobs);
  }

  @OnJob({ name: JobName.PartialAssetCleanup, queue: QueueName.BackgroundTask })
  removeStaleUpload({ id }: JobOf<JobName.PartialAssetCleanup>): Promise<JobStatus> {
    return this.databaseRepository.withUuidLock(id, async () => {
      const asset = await this.assetJobRepository.getForPartialAssetCleanupJob(id);
      if (!asset) {
        return JobStatus.Skipped;
      }
      const { checksum, fileModifiedAt, path, size } = asset;
      try {
        const stat = await this.storageRepository.stat(path);
        if (size === stat.size && checksum === (await this.cryptoRepository.hashFile(path))) {
          await this.onComplete({ id, path, fileModifiedAt });
          return JobStatus.Success;
        }
      } catch (error: any) {
        this.logger.debugFn(() => `Failed to check upload file ${path}: ${error.message}`);
      }
      await this.onCancel(id, path);
      return JobStatus.Success;
    });
  }

  async onStart(
    auth: AuthDto,
    { assetData, checksum, uploadLength }: StartUploadDto,
  ): Promise<{ id: string; path: string; status: AssetStatus; isDuplicate: boolean }> {
    const assetId = this.cryptoRepository.randomUUID();
    const folder = StorageCore.getNestedFolder(StorageFolder.Upload, auth.user.id, assetId);
    const extension = extname(assetData.filename);
    const path = join(folder, `${assetId}${extension}`);
    const type = mimeTypes.assetType(path);

    if (type === AssetType.Other) {
      throw new BadRequestException(`${assetData.filename} is an unsupported file type`);
    }

    this.validateQuota(auth, uploadLength);

    try {
      await this.assetRepository.createWithMetadata(
        {
          id: assetId,
          ownerId: auth.user.id,
          libraryId: null,
          checksum,
          originalPath: path,
          deviceAssetId: assetData.deviceAssetId,
          deviceId: assetData.deviceId,
          fileCreatedAt: assetData.fileCreatedAt,
          fileModifiedAt: assetData.fileModifiedAt,
          localDateTime: assetData.fileCreatedAt,
          type,
          isFavorite: assetData.isFavorite,
          visibility: AssetVisibility.Hidden,
          originalFileName: assetData.filename,
          status: AssetStatus.Partial,
        },
        uploadLength,
        assetData.iCloudId ? [{ key: AssetMetadataKey.MobileApp, value: { iCloudId: assetData.iCloudId } }] : undefined,
      );
    } catch (error: any) {
      if (!isAssetChecksumConstraint(error)) {
        this.logger.error(`Error creating upload asset record: ${error.message}`);
        throw new InternalServerErrorException('Error creating asset');
      }

      const duplicate = await this.assetRepository.getUploadAssetIdByChecksum(auth.user.id, checksum);
      if (!duplicate) {
        throw new InternalServerErrorException('Error locating duplicate for checksum constraint');
      }

      return { id: duplicate.id, path, status: duplicate.status, isDuplicate: true };
    }

    await this.storageRepository.mkdir(folder);
    return { id: assetId, path, status: AssetStatus.Partial, isDuplicate: false };
  }

  async onComplete({ id, path, fileModifiedAt }: { id: string; path: string; fileModifiedAt: Date }) {
    this.logger.debug('Completing upload for asset', id);
    const jobData = { name: JobName.AssetExtractMetadata, data: { id, source: 'upload' } } as const;
    await withRetry(() => this.assetRepository.setComplete(id));
    try {
      await withRetry(() => this.storageRepository.utimes(path, new Date(), fileModifiedAt));
    } catch (error: any) {
      this.logger.error(`Failed to update times for ${path}: ${error.message}`);
    }
    await withRetry(() => this.jobRepository.queue(jobData));
  }

  async onCancel(assetId: string, path: string): Promise<void> {
    this.logger.debug('Cancelling upload for asset', assetId);
    await withRetry(() => this.storageRepository.unlink(path));
    await withRetry(() => this.assetRepository.removeAndDecrementQuota(assetId));
  }

  private addRequest(assetId: string, req: Readable) {
    const addTime = new Date();
    const activeRequest = { req, startTime: addTime };
    this.abortExistingRequest(assetId, addTime);
    this.activeRequests.set(assetId, activeRequest);
    req.on('close', () => {
      if (this.activeRequests.get(assetId)?.req === req) {
        this.activeRequests.delete(assetId);
      }
    });
  }

  private abortExistingRequest(assetId: string, abortTime = new Date()) {
    const abortEvent = { assetId, abortTime };
    // only emit if we didn't just abort it ourselves
    if (!this.onUploadAbort(abortEvent)) {
      this.eventRepository.serverSend('UploadAbort', abortEvent);
    }
  }

  private sendInterimResponse({ socket }: Response, location: string, interopVersion: number): void {
    if (socket && !socket.destroyed) {
      // Express doesn't understand interim responses, so write directly to socket
      socket.write(
        'HTTP/1.1 104 Upload Resumption Supported\r\n' +
          `Location: ${location}\r\n` +
          'Upload-Limit: min-size=0\r\n' +
          `Upload-Draft-Interop-Version: ${interopVersion}\r\n\r\n`,
      );
    }
  }

  private sendInconsistentLength(res: Response): void {
    res.status(400).contentType('application/problem+json').send({
      type: 'https://iana.org/assignments/http-problem-types#inconsistent-upload-length',
      title: 'inconsistent length values for upload',
    });
  }

  private sendAlreadyCompleted(res: Response): void {
    res.status(400).contentType('application/problem+json').send({
      type: 'https://iana.org/assignments/http-problem-types#completed-upload',
      title: 'upload is already completed',
    });
  }

  private sendOffsetMismatch(res: Response, expected: number, actual: number): void {
    res.status(409).contentType('application/problem+json').setHeader('Upload-Offset', expected.toString()).send({
      type: 'https://iana.org/assignments/http-problem-types#mismatching-upload-offset',
      title: 'offset from request does not match offset of resource',
      'expected-offset': expected,
      'provided-offset': actual,
    });
  }

  private sendChecksumMismatch(res: Response, assetId: string, path: string) {
    this.logger.warn(`Removing upload asset ${assetId} due to checksum mismatch`);
    res.status(460).send('File on server does not match provided checksum');
    return this.onCancel(assetId, path);
  }

  private validateQuota(auth: AuthDto, size: number): void {
    const { quotaSizeInBytes: quotaLimit, quotaUsageInBytes: currentUsage } = auth.user;
    if (quotaLimit === null) {
      return;
    }

    if (quotaLimit < currentUsage + size) {
      throw new BadRequestException('Quota has been exceeded!');
    }
  }

  private async getCurrentOffset(path: string): Promise<number> {
    try {
      const stat = await this.storageRepository.stat(path);
      return stat.size;
    } catch (error: any) {
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
        return 0;
      }
      throw error;
    }
  }

  private setCompleteHeader(res: Response, interopVersion: number | null, isComplete: boolean): void {
    if (!interopVersion) {
      return;
    }

    if (interopVersion > 3) {
      res.setHeader('Upload-Complete', isComplete ? '?1' : '?0');
    } else {
      res.setHeader('Upload-Incomplete', isComplete ? '?0' : '?1');
    }
  }
}
