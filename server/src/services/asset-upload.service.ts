import { BadRequestException, Injectable } from '@nestjs/common';
import { Response } from 'express';
import { createHash } from 'node:crypto';
import { extname, join } from 'node:path';
import { Readable } from 'node:stream';
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
          type: type,
          isFavorite: assetData.isFavorite,
          duration: assetData.duration || null,
          visibility: assetData.visibility || AssetVisibility.Timeline,
          originalFileName: assetData.filename,
          status: AssetStatus.Partial,
        },
        uploadLength,
        assetData.metadata,
      );
    } catch (error: any) {
      if (isAssetChecksumConstraint(error)) {
        const duplicate = await this.assetRepository.getUploadAssetIdByChecksum(req.auth.user.id, dto.checksum);
        if (!duplicate) {
          res.status(500).send('Error locating duplicate for checksum constraint');
          return;
        }

        if (duplicate.status !== AssetStatus.Partial) {
          return this.sendAlreadyCompletedProblem(res);
        }
        const location = `/api/upload/${duplicate.id}`;
        res.status(400).setHeader('Location', location).send('Incomplete asset already exists');
        return;
      }
      this.logger.error(`Error creating upload asset record: ${error.message}`);
      res.status(500).send('Error creating upload asset record');
      return;
    }

    if (isComplete && uploadLength && uploadLength !== contentLength) {
      return this.sendInconsistentLengthProblem(res);
    }

    const location = `/api/upload/${assetId}`;
    if (version <= MAX_RUFH_INTEROP_VERSION) {
      this.sendInterimResponse(res, location, version);
    }

    await this.storageRepository.mkdir(folder);
    let checksumBuffer: Buffer | undefined;
    const metadata = { id: assetId, path, size: contentLength, fileModifiedAt: assetData.fileModifiedAt };
    const writeStream = this.pipe(req, res, metadata);

    if (isComplete) {
      const hash = createHash('sha1');
      req.on('data', (data: Buffer) => hash.update(data));
      writeStream.on('finish', () => (checksumBuffer = hash.digest()));
    }

    writeStream.on('finish', () => {
      this.setCompleteHeader(res, dto.version, isComplete);
      if (!isComplete) {
        return res.status(201).set('Location', location).setHeader('Upload-Limit', 'min-size=0').send();
      }
      this.logger.log(`Finished upload to ${path}`);
      if (dto.checksum.compare(checksumBuffer!) !== 0) {
        return this.sendChecksumMismatchResponse(res, assetId, path);
      }

      this.onComplete(metadata)
        .then(() => res.status(200).send())
        .catch((error) => {
          this.logger.error(`Failed to complete upload for ${assetId}: ${error.message}`);
          res.status(500).send();
        });
    });
    await new Promise((resolve) => writeStream.on('close', resolve));
  }

  resumeUpload(req: AuthenticatedRequest, res: Response, id: string, dto: ResumeUploadDto): Promise<void> {
    this.logger.verboseFn(() => `Resuming upload for ${id}: ${JSON.stringify(dto)}`);
    const { isComplete, uploadLength, uploadOffset, contentLength, version } = dto;

    return this.databaseRepository.withUuidLock(id, async () => {
      const completionData = await this.assetRepository.getCompletionMetadata(id, req.auth.user.id);
      if (!completionData) {
        res.status(404).send('Asset not found');
        return;
      }
      const { fileModifiedAt, path, status, checksum: providedChecksum, size } = completionData;

      if (status !== AssetStatus.Partial) {
        this.setCompleteHeader(res, version, false);
        return this.sendAlreadyCompletedProblem(res);
      }

      if (uploadLength && size && size !== uploadLength) {
        this.setCompleteHeader(res, version, false);
        return this.sendInconsistentLengthProblem(res);
      }

      const expectedOffset = await this.getCurrentOffset(path);
      if (expectedOffset !== uploadOffset) {
        this.setCompleteHeader(res, version, false);
        return this.sendOffsetMismatchProblem(res, expectedOffset, uploadOffset);
      }

      const newLength = uploadOffset + contentLength;
      if (uploadLength !== undefined && newLength > uploadLength) {
        this.setCompleteHeader(res, version, false);
        res.status(400).send('Upload would exceed declared length');
        return;
      }

      this.validateQuota(req.auth, newLength);

      if (contentLength === 0 && !isComplete) {
        this.setCompleteHeader(res, version, false);
        res.status(204).setHeader('Upload-Offset', expectedOffset.toString()).send();
        return;
      }

      const metadata = { id, path, size: contentLength, fileModifiedAt: fileModifiedAt };
      const writeStream = this.pipe(req, res, metadata);
      writeStream.on('finish', async () => {
        this.setCompleteHeader(res, version, isComplete);
        const currentOffset = await this.getCurrentOffset(path);
        if (!isComplete) {
          return res.status(204).setHeader('Upload-Offset', currentOffset.toString()).send();
        }

        this.logger.log(`Finished upload to ${path}`);
        const checksum = await this.cryptoRepository.hashFile(path);
        if (providedChecksum.compare(checksum) !== 0) {
          return this.sendChecksumMismatchResponse(res, id, path);
        }

        try {
          await this.onComplete(metadata);
        } finally {
          res.status(200).send();
        }
      });
      await new Promise((resolve) => writeStream.on('close', resolve));
    });
  }

  cancelUpload(auth: AuthDto, assetId: string, response: Response): Promise<void> {
    return this.databaseRepository.withUuidLock(assetId, async () => {
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
    });
  }

  async getUploadStatus(auth: AuthDto, res: Response, id: string, { version }: GetUploadStatusDto): Promise<void> {
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

  private pipe(req: Readable, res: Response, { id, path, size }: { id: string; path: string; size: number }) {
    const writeStream = this.storageRepository.createOrAppendWriteStream(path);
    writeStream.on('error', (error) => {
      this.logger.error(`Failed to write chunk to ${path}: ${error.message}`);
      if (!res.headersSent) {
        res.status(500).send();
      }
    });

    req.on('error', (error) => {
      this.logger.error(`Failed to read request body: ${error.message}`);
      if (!res.headersSent) {
        res.status(500).send();
      }
    });

    let receivedLength = 0;
    req.on('data', (data: Buffer) => {
      if (receivedLength + data.length > size) {
        writeStream.destroy();
        req.destroy();
        return this.onCancel(id, path).finally(() =>
          res.status(400).send('Received more data than specified in content-length'),
        );
      }
      receivedLength += data.length;
      if (!writeStream.write(data)) {
        req.pause();
        writeStream.once('drain', () => req.resume());
      }
    });

    req.on('end', () => {
      if (receivedLength === size) {
        return writeStream.end();
      }
      writeStream.destroy();
      this.onCancel(id, path).finally(() =>
        res.status(400).send(`Received ${receivedLength} bytes when expecting ${size}`),
      );
    });

    return writeStream;
  }

  private async onComplete({ id, path, fileModifiedAt }: { id: string; path: string; fileModifiedAt: Date }) {
    this.logger.debug('Completing upload for asset', id);
    const jobData = { name: JobName.AssetExtractMetadata, data: { id: id, source: 'upload' } } as const;
    await withRetry(() => this.assetRepository.setComplete(id));
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
    await withRetry(() => this.assetRepository.removeAndDecrementQuota(assetId));
  }

  private sendInterimResponse({ socket }: Response, location: string, interopVersion: number): void {
    if (socket && !socket.destroyed) {
      // Express doesn't understand interim responses, so write directly to socket
      socket.write(
        'HTTP/1.1 104 Upload Resumption Supported\r\n' +
          `Location: ${location}\r\n` +
          `Upload-Limit: min-size=0\r\n` +
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
    res.status(460).send('File on server does not match provided checksum');
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
