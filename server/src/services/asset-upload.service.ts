import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Response } from 'express';
import { createHash } from 'node:crypto';
import { extname, join } from 'node:path';
import { StorageCore } from 'src/cores/storage.core';
import { AuthDto } from 'src/dtos/auth.dto';
import { GetUploadStatusDto, ResumeUploadDto, StartUploadDto } from 'src/dtos/upload.dto';
import { AssetStatus, AssetType, AssetVisibility, JobName, StorageFolder } from 'src/enum';
import { AuthenticatedRequest } from 'src/middleware/auth.guard';
import { BaseService } from 'src/services/base.service';
import { isAssetChecksumConstraint } from 'src/utils/database';
import { mimeTypes } from 'src/utils/mime-types';
import { withRetry } from 'src/utils/misc';

export const MAX_RUFH_INTEROP_VERSION = 8;

@Injectable()
export class AssetUploadService extends BaseService {
  async startUpload(req: AuthenticatedRequest, res: Response, dto: StartUploadDto): Promise<void> {
    this.logger.verboseFn(() => `Starting upload: ${JSON.stringify(dto)}`);
    const { isComplete, assetData, uploadLength, contentLength, version } = dto;
    if (isComplete && uploadLength !== undefined && uploadLength !== contentLength) {
      return this.sendInconsistentLengthProblem(res);
    }

    const assetId = this.cryptoRepository.randomUUID();
    const folder = StorageCore.getNestedFolder(StorageFolder.Upload, req.auth.user.id, assetId);
    const extension = extname(assetData.filename);
    const path = join(folder, `${assetId}${extension}`);
    const type = mimeTypes.assetType(path);

    if (type === AssetType.Other) {
      throw new BadRequestException(`${assetData.filename} is an unsupported file type`);
    }

    this.validateQuota(req.auth, uploadLength ?? contentLength);

    try {
      await this.assetRepository.createWithMetadata(
        {
          id: assetId,
          ownerId: req.auth.user.id,
          libraryId: null,
          checksum: dto.checksum,
          originalPath: path,
          deviceAssetId: assetData.deviceAssetId,
          deviceId: assetData.deviceId,
          fileCreatedAt: assetData.fileCreatedAt,
          fileModifiedAt: assetData.fileModifiedAt,
          localDateTime: assetData.fileCreatedAt,
          type: mimeTypes.assetType(path),
          isFavorite: assetData.isFavorite,
          duration: assetData.duration || null,
          visibility: assetData.visibility || AssetVisibility.Timeline,
          originalFileName: assetData.filename,
          status: AssetStatus.Partial,
        },
        assetData.metadata,
      );
    } catch (error: any) {
      if (isAssetChecksumConstraint(error)) {
        const duplicate = await this.assetRepository.getUploadAssetIdByChecksum(req.auth.user.id, dto.checksum);
        if (!duplicate) {
          throw new InternalServerErrorException('Error locating duplicate for checksum constraint');
        }

        if (duplicate.status !== AssetStatus.Partial) {
          return this.sendAlreadyCompletedProblem(res);
        }
        const location = `/api/upload/${duplicate.id}`;
        res.status(201).setHeader('Location', location).setHeader('Upload-Limit', 'min-size=0').send();
        return;
      }
      this.logger.error(`Error creating upload asset record: ${error.message}`);
      res.status(500).send('Error creating upload asset record');
      return;
    }

    const location = `/api/upload/${assetId}`;
    if (version <= MAX_RUFH_INTEROP_VERSION) {
      this.sendInterimResponse(res, location, version);
    }

    await this.storageRepository.mkdir(folder);
    let checksumBuffer: Buffer | undefined;
    const writeStream = this.storageRepository.createWriteStream(path);

    if (isComplete) {
      const hash = createHash('sha1');
      req.on('data', (chunk: Buffer) => hash.update(chunk));
      writeStream.on('finish', () => (checksumBuffer = hash.digest()));
    }

    writeStream.on('error', (error) => {
      this.logger.error(`Failed to write chunk to ${path}: ${error.message}`);
      if (!res.headersSent) {
        res.status(500).setHeader('Location', location).send();
      }
    });

    writeStream.on('finish', async () => {
      if (!isComplete) {
        return res.status(201).setHeader('Location', location).setHeader('Upload-Limit', 'min-size=0').send();
      }
      this.logger.log(`Finished upload to ${path}`);
      if (dto.checksum.compare(checksumBuffer!) !== 0) {
        return this.sendChecksumMismatchResponse(res, assetId, path);
      }

      try {
        await this.onComplete({ assetId, path, size: contentLength, fileModifiedAt: assetData.fileModifiedAt });
      } finally {
        this.setCompleteHeader(res, dto.version, true);
        res.status(200).setHeader('Location', location).setHeader('Upload-Limit', 'min-size=0').send();
      }
    });

    req.on('error', (error) => {
      this.logger.error(`Failed to read request body: ${error.message}`);
      writeStream.end();
      if (!res.headersSent) {
        res.status(500).setHeader('Location', location).send();
      }
    });

    let receivedLength = 0;
    req.on('data', (chunk: Buffer) => {
      if (receivedLength + chunk.length > contentLength) {
        writeStream.destroy();
        req.destroy();
        res.status(400).send('Received more data than specified in content-length');
        return this.onCancel(assetId, path);
      }
      receivedLength += chunk.length;
      if (!writeStream.write(chunk)) {
        req.pause();
        writeStream.once('drain', () => req.resume());
      }
    });

    req.on('end', () => {
      if (receivedLength === contentLength) {
        return writeStream.end();
      }
      this.logger.error(`Received ${receivedLength} bytes when expecting ${contentLength} for ${assetId}`);
      writeStream.destroy();
      this.onCancel(assetId, path);
    });
    await new Promise((resolve) => writeStream.on('close', resolve));
  }

  resumeUpload(req: AuthenticatedRequest, res: Response, id: string, dto: ResumeUploadDto): Promise<void> {
    this.logger.verboseFn(() => `Resuming upload for ${id}: ${JSON.stringify(dto)}`);
    const { isComplete, uploadLength, uploadOffset, contentLength, version } = dto;
    if (isComplete && uploadLength !== undefined && uploadLength !== contentLength) {
      this.sendInconsistentLengthProblem(res);
      return Promise.resolve();
    }

    if (version && version >= 6 && req.headers['content-type'] !== 'application/partial-upload') {
      throw new BadRequestException('Content-Type must be application/partial-upload for PATCH requests');
    }

    return this.databaseRepository.withUuidLock(id, async () => {
      const asset = await this.assetRepository.getCompletionMetadata(id, req.auth.user.id);
      if (!asset) {
        res.status(404).send('Asset not found');
        return;
      }

      if (asset.status !== AssetStatus.Partial) {
        return this.sendAlreadyCompletedProblem(res);
      }
      if (uploadOffset === null) {
        throw new BadRequestException('Missing Upload-Offset header');
      }

      const { path } = asset;
      const expectedOffset = await this.getCurrentOffset(path);
      if (expectedOffset !== uploadOffset) {
        this.setCompleteHeader(res, version, false);
        return this.sendOffsetMismatchProblem(res, expectedOffset, uploadOffset);
      }

      const newLength = uploadOffset + contentLength;

      // If upload length is provided, validate we're not exceeding it
      if (uploadLength !== undefined && newLength > uploadLength) {
        res.status(400).send('Upload would exceed declared length');
        return;
      }

      this.validateQuota(req.auth, newLength);

      // Empty PATCH without Upload-Complete
      if (contentLength === 0 && !isComplete) {
        this.setCompleteHeader(res, version, false);
        res.status(204).setHeader('Upload-Offset', expectedOffset.toString()).send();
        return;
      }

      const writeStream = this.storageRepository.createOrAppendWriteStream(path);
      let receivedLength = 0;

      writeStream.on('error', (error) => {
        this.logger.error(`Failed to write chunk to ${path}: ${error.message}`);
        if (!res.headersSent) {
          res.status(500).send('Failed to write chunk');
        }
      });

      writeStream.on('finish', async () => {
        const currentOffset = await this.getCurrentOffset(path);
        if (!isComplete) {
          this.setCompleteHeader(res, version, false);
          return res.status(204).setHeader('Upload-Offset', currentOffset.toString()).send();
        }

        this.logger.log(`Finished upload to ${path}`);
        const checksum = await this.cryptoRepository.hashFile(path);
        if (asset.checksum.compare(checksum) !== 0) {
          return this.sendChecksumMismatchResponse(res, id, path);
        }

        try {
          await this.onComplete({ assetId: id, path, size: currentOffset, fileModifiedAt: asset.fileModifiedAt });
        } finally {
          this.setCompleteHeader(res, version, true);
          res.status(200).setHeader('Upload-Offset', currentOffset.toString()).send();
        }
      });

      req.on('data', (chunk: Buffer) => {
        if (receivedLength + chunk.length > contentLength) {
          this.logger.error(`Received more data than specified in content-length for upload to ${path}`);
          writeStream.destroy();
          req.destroy();
          res.status(400).send('Received more data than specified in content-length');
          return this.onCancel(id, path);
        }

        receivedLength += chunk.length;
        if (!writeStream.write(chunk)) {
          req.pause();
          writeStream.once('drain', () => req.resume());
        }
      });

      req.on('end', () => {
        if (receivedLength === contentLength) {
          return writeStream.end();
        }
        this.logger.error(`Received ${receivedLength} bytes when expecting ${contentLength} for ${id}`);
        writeStream.destroy();
        return this.onCancel(id, path);
      });
      await new Promise((resolve) => writeStream.on('close', resolve));
    });
  }

  async cancelUpload(auth: AuthDto, assetId: string, response: Response): Promise<void> {
    const asset = await this.assetRepository.getCompletionMetadata(assetId, auth.user.id);
    if (!asset) {
      response.status(404).send('Asset not found');
      return;
    }
    if (asset.status !== AssetStatus.Partial) {
      return this.sendAlreadyCompletedProblem(response);
    }
    await this.onCancel(assetId, asset.path);
    response.status(204).send();
  }

  async getUploadStatus(auth: AuthDto, res: Response, id: string, { version }: GetUploadStatusDto): Promise<void> {
    return this.databaseRepository.withUuidLock(id, async () => {
      const asset = await this.assetRepository.getCompletionMetadata(id, auth.user.id);
      if (!asset) {
        res.status(404).send('Asset not found');
        return;
      }

      const offset = await this.getCurrentOffset(asset.path);
      const isComplete = asset.status !== AssetStatus.Partial;

      this.setCompleteHeader(res, version, isComplete);
      res
        .status(204)
        .setHeader('Upload-Offset', offset.toString())
        .setHeader('Cache-Control', 'no-store')
        .setHeader('Upload-Limit', 'min-size=0')
        .send();
    });
  }

  async getUploadOptions(response: Response): Promise<void> {
    response.status(204).setHeader('Upload-Limit', 'min-size=0').setHeader('Allow', 'POST, OPTIONS').send();
  }

  private async onComplete(data: { assetId: string; path: string; size: number; fileModifiedAt: Date }): Promise<void> {
    const { assetId, path, size, fileModifiedAt } = data;
    this.logger.debug('Completing upload for asset', assetId);
    const jobData = { name: JobName.AssetExtractMetadata, data: { id: assetId, source: 'upload' } } as const;
    await withRetry(() => this.assetRepository.setCompleteWithSize(assetId, size));
    try {
      await withRetry(() => this.storageRepository.utimes(path, new Date(), fileModifiedAt));
    } catch (error: any) {
      this.logger.error(`Failed to update times for ${path}: ${error.message}`);
    }
    await withRetry(() => this.jobRepository.queue(jobData));
  }

  private async onCancel(assetId: string, path: string): Promise<void> {
    this.logger.debug('Cancelling upload for asset', assetId);
    await withRetry(() => this.storageRepository.unlink(path));
    await withRetry(() => this.assetRepository.remove({ id: assetId }));
  }

  private sendInterimResponse({ socket }: Response, location: string, interopVersion: number): void {
    if (socket && !socket.destroyed) {
      // Express doesn't understand interim responses, so write directly to socket
      socket.write(
        'HTTP/1.1 104 Upload Resumption Supported\r\n' +
          `Location: ${location}\r\n` +
          `Upload-Draft-Interop-Version: ${interopVersion}\r\n\r\n`,
      );
    }
  }

  private sendInconsistentLengthProblem(res: Response): void {
    res.status(400).contentType('application/problem+json').send({
      type: 'https://iana.org/assignments/http-problem-types#inconsistent-upload-length',
      title: 'inconsistent length values for upload',
    });
  }

  private sendAlreadyCompletedProblem(res: Response): void {
    res.status(400).contentType('application/problem+json').send({
      type: 'https://iana.org/assignments/http-problem-types#completed-upload',
      title: 'upload is already completed',
    });
  }

  private sendOffsetMismatchProblem(res: Response, expected: number, actual: number): void {
    res.status(409).contentType('application/problem+json').setHeader('Upload-Offset', expected.toString()).send({
      type: 'https://iana.org/assignments/http-problem-types#mismatching-upload-offset',
      title: 'offset from request does not match offset of resource',
      'expected-offset': expected,
      'provided-offset': actual,
    });
  }

  private sendChecksumMismatchResponse(res: Response, assetId: string, path: string): Promise<void> {
    this.logger.warn(`Removing upload asset ${assetId} due to checksum mismatch`);
    res.status(460).send('Checksum mismatch');
    return this.onCancel(assetId, path);
  }

  private validateQuota(auth: AuthDto, size: number): void {
    if (auth.user.quotaSizeInBytes === null) {
      return;
    }

    if (auth.user.quotaSizeInBytes < auth.user.quotaUsageInBytes + size) {
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
