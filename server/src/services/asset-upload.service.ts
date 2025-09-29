import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Request, Response } from 'express';
import { createHash } from 'node:crypto';
import { extname, join } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { StorageCore } from 'src/cores/storage.core';
import { AuthDto } from 'src/dtos/auth.dto';
import { UploadAssetDataDto } from 'src/dtos/upload.dto';
import { AssetStatus, AssetType, AssetVisibility, ImmichHeader, JobName, StorageFolder } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { isAssetChecksumConstraint } from 'src/utils/database';
import { mimeTypes } from 'src/utils/mime-types';
import { parseDictionary } from 'structured-headers';

const MAX_INTEROP_VERSION = 8;

@Injectable()
export class AssetUploadService extends BaseService {
  async startUpload(auth: AuthDto, request: Request, response: Response): Promise<void> {
    const headers = request.headers;
    const requestInterop = this.getNumberHeader(headers, 'upload-draft-interop-version');
    const contentLength = this.requireContentLength(headers);
    const isComplete = this.requireUploadComplete(headers, requestInterop);
    const metadata = this.requireAssetData(headers);
    const checksumHeader = this.requireChecksum(headers);
    const uploadLength = this.getNumberHeader(headers, 'upload-length');

    if (isComplete && uploadLength !== null && uploadLength !== contentLength) {
      return this.sendInconsistentLengthProblem(response);
    }

    const assetId = this.cryptoRepository.randomUUID();
    const folder = StorageCore.getNestedFolder(StorageFolder.Upload, auth.user.id, assetId);
    const extension = extname(metadata.filename);
    const path = join(folder, `${assetId}${extension}`);
    const type = mimeTypes.assetType(path);

    if (type === AssetType.Other) {
      throw new BadRequestException(`${metadata.filename} is an unsupported file type`);
    }

    this.validateQuota(auth, uploadLength ?? contentLength);

    try {
      await this.assetRepository.create({
        id: assetId,
        ownerId: auth.user.id,
        libraryId: null,
        checksum: checksumHeader,
        originalPath: path,
        deviceAssetId: metadata.deviceAssetId,
        deviceId: metadata.deviceId,
        fileCreatedAt: metadata.fileCreatedAt,
        fileModifiedAt: metadata.fileModifiedAt,
        localDateTime: metadata.fileCreatedAt,
        type: mimeTypes.assetType(path),
        isFavorite: metadata.isFavorite,
        duration: metadata.duration || null,
        visibility: metadata.visibility || AssetVisibility.Timeline,
        originalFileName: metadata.filename,
        status: AssetStatus.Partial,
      });
    } catch (error: any) {
      if (isAssetChecksumConstraint(error)) {
        const duplicate = await this.assetRepository.getUploadAssetIdByChecksum(auth.user.id, checksumHeader);
        if (!duplicate) {
          throw new InternalServerErrorException('Error locating duplicate for checksum constraint');
        }

        if (duplicate.status !== AssetStatus.Partial) {
          return this.sendAlreadyCompletedProblem(response);
        }
        const location = `/api/upload/${duplicate.id}`;
        response.status(201).setHeader('Location', location).setHeader('Upload-Limit', 'min-size=0').send();
        return;
      }
      this.logger.error(`Error creating upload asset record: ${error.message}`);
      response.status(500).send('Error creating upload asset record');
      return;
    }

    const location = `/api/upload/${assetId}`;
    if (requestInterop !== null && requestInterop >= 3 && requestInterop <= MAX_INTEROP_VERSION) {
      this.sendInterimResponse(response, location, requestInterop);
    }

    await this.storageRepository.mkdir(folder);
    let checksumBuffer: Buffer | undefined;
    const writeStream = this.storageRepository.createWriteStream(path);

    if (isComplete) {
      const hash = createHash('sha1');
      request.on('data', (chunk: Buffer) => hash.update(chunk));
      writeStream.on('finish', () => (checksumBuffer = hash.digest()));
    }

    writeStream.on('error', (error) => {
      this.logger.error(`Failed to write chunk to ${path}: ${error.message}`);
      if (!response.headersSent) {
        response.status(500).setHeader('Location', location).send();
      }
    });

    writeStream.on('finish', () => {
      if (!isComplete) {
        return response.status(201).setHeader('Location', location).setHeader('Upload-Limit', 'min-size=0').send();
      }
      this.logger.log(`Finished upload to ${path}`);
      if (checksumHeader.compare(checksumBuffer!) !== 0) {
        return this.sendChecksumMismatchResponse(response, assetId, path);
      }

      this.setCompleteHeader(response, requestInterop, true);
      response.status(200).setHeader('Location', location).setHeader('Upload-Limit', 'min-size=0').send();

      return this.onComplete({ assetId, path, size: contentLength, fileModifiedAt: metadata.fileModifiedAt });
    });

    request.on('error', (error) => {
      this.logger.error(`Failed to read request body: ${error.message}`);
      writeStream.end();
      if (!response.headersSent) {
        response.status(500).setHeader('Location', location).send();
      }
    });

    let receivedLength = 0;
    request.on('data', (chunk: Buffer) => {
      if (receivedLength + chunk.length > contentLength) {
        writeStream.destroy();
        request.destroy();
        response.status(400).send('Received more data than specified in content-length');
        return this.removeAsset(assetId, path);
      }
      receivedLength += chunk.length;
      if (!writeStream.write(chunk)) {
        request.pause();
        writeStream.once('drain', () => request.resume());
      }
    });

    request.on('end', () => {
      if (receivedLength === contentLength) {
        return writeStream.end();
      }
      this.logger.error(`Received ${receivedLength} bytes when expecting ${contentLength} for ${assetId}`);
      writeStream.destroy();
      this.removeAsset(assetId, path);
    });
  }

  async resumeUpload(auth: AuthDto, assetId: string, request: Request, response: Response): Promise<void> {
    const headers = request.headers;
    const requestInterop = this.getNumberHeader(headers, 'upload-draft-interop-version');
    const isComplete = this.requireUploadComplete(headers, requestInterop);
    const contentLength = this.requireContentLength(headers);
    const providedOffset = this.getNumberHeader(headers, 'upload-offset');
    const uploadLength = this.getNumberHeader(headers, 'upload-length');

    const contentType = headers['content-type'];
    if (requestInterop && requestInterop >= 6 && contentType !== 'application/partial-upload') {
      throw new BadRequestException('Content-Type must be application/partial-upload for PATCH requests');
    }

    await this.databaseRepository.withUuidLock(assetId, async () => {
      const asset = await this.assetRepository.getCompletionMetadata(assetId, auth.user.id);
      if (!asset) {
        response.status(404).send('Asset not found');
        return;
      }

      if (asset.status !== AssetStatus.Partial) {
        return this.sendAlreadyCompletedProblem(response);
      }
      if (providedOffset === null) {
        throw new BadRequestException('Missing Upload-Offset header');
      }

      const { path } = asset;
      const expectedOffset = await this.getCurrentOffset(path);
      if (expectedOffset !== providedOffset) {
        this.setCompleteHeader(response, requestInterop, false);
        return this.sendOffsetMismatchProblem(response, expectedOffset, providedOffset);
      }

      const newLength = providedOffset + contentLength;

      // If upload length is provided, validate we're not exceeding it
      if (uploadLength !== null && newLength > uploadLength) {
        response.status(400).send('Upload would exceed declared length');
        return;
      }

      this.validateQuota(auth, newLength);

      // Empty PATCH without Upload-Complete
      if (contentLength === 0 && !isComplete) {
        this.setCompleteHeader(response, requestInterop, false);
        response.status(204).setHeader('Upload-Offset', expectedOffset.toString()).send();
        return;
      }

      const writeStream = this.storageRepository.createOrAppendWriteStream(path);
      let receivedLength = 0;

      writeStream.on('error', (error) => {
        this.logger.error(`Failed to write chunk to ${path}: ${error.message}`);
        if (!response.headersSent) {
          response.status(500).send('Failed to write chunk');
        }
      });

      writeStream.on('finish', async () => {
        const currentOffset = await this.getCurrentOffset(path);
        if (!isComplete) {
          this.setCompleteHeader(response, requestInterop, false);
          return response.status(204).setHeader('Upload-Offset', currentOffset.toString()).send();
        }

        this.logger.log(`Finished upload to ${path}`);
        const checksum = await this.cryptoRepository.hashFile(path);
        if (asset.checksum.compare(checksum) !== 0) {
          return this.sendChecksumMismatchResponse(response, assetId, path);
        }

        this.setCompleteHeader(response, requestInterop, true);
        response.status(200).setHeader('Upload-Offset', currentOffset.toString()).send();

        await this.onComplete({ assetId, path, size: currentOffset, fileModifiedAt: asset.fileModifiedAt });
      });

      request.on('data', (chunk: Buffer) => {
        if (receivedLength + chunk.length > contentLength) {
          this.logger.error(`Received more data than specified in content-length for upload to ${path}`);
          writeStream.destroy();
          request.destroy();
          response.status(400).send('Received more data than specified in content-length');
          return this.removeAsset(assetId, path);
        }

        receivedLength += chunk.length;
        if (!writeStream.write(chunk)) {
          request.pause();
          writeStream.once('drain', () => request.resume());
        }
      });

      request.on('end', () => {
        if (receivedLength === contentLength) {
          return writeStream.end();
        }
        this.logger.error(`Received ${receivedLength} bytes when expecting ${contentLength} for ${assetId}`);
        writeStream.destroy();
        return this.removeAsset(assetId, path);
      });
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
    await this.removeAsset(assetId, asset.path);
    response.status(204).send();
  }

  async getUploadStatus(auth: AuthDto, assetId: string, response: Response) {
    return this.databaseRepository.withUuidLock(assetId, async () => {
      const asset = await this.assetRepository.getCompletionMetadata(assetId, auth.user.id);
      if (!asset) {
        response.status(404).send('Asset not found');
        return;
      }

      const offset = await this.getCurrentOffset(asset.path);
      const isComplete = asset.status !== AssetStatus.Partial;

      const requestInterop = this.getNumberHeader(response.req.headers, 'upload-draft-interop-version');
      this.setCompleteHeader(response, requestInterop, isComplete);
      response
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
    const jobData = { name: JobName.AssetExtractMetadata, data: { id: assetId, source: 'upload' } } as const;
    await this.withRetry(() => this.assetRepository.setCompleteWithSize(assetId, size));
    await this.withRetry(() => this.jobRepository.queue(jobData));
    await this.withRetry(() => this.storageRepository.utimes(path, new Date(), fileModifiedAt));
  }

  private async removeAsset(assetId: string, path: string): Promise<void> {
    await this.withRetry(() => this.storageRepository.unlink(path));
    await this.withRetry(() => this.assetRepository.remove({ id: assetId }));
  }

  private sendInterimResponse(response: Response, location: string, interopVersion: number): void {
    const socket = response.socket;
    if (socket && !socket.destroyed) {
      // Express doesn't understand interim responses, so write directly to socket
      socket.write(
        'HTTP/1.1 104 Upload Resumption Supported\r\n' +
          `Location: ${location}\r\n` +
          `Upload-Draft-Interop-Version: ${interopVersion}\r\n\r\n`,
      );
    }
  }

  private sendInconsistentLengthProblem(response: Response): void {
    response.status(400).contentType('application/problem+json').send({
      type: `https://iana.org/assignments/http-problem-types#inconsistent-upload-length`,
      title: 'inconsistent length values for upload',
    });
  }

  private sendAlreadyCompletedProblem(response: Response): void {
    response.status(400).contentType('application/problem+json').send({
      type: `https://iana.org/assignments/http-problem-types#completed-upload`,
      title: 'upload is already completed',
    });
  }

  private sendOffsetMismatchProblem(response: Response, expected: number, actual: number): void {
    response.status(409).contentType('application/problem+json').setHeader('Upload-Offset', expected.toString()).send({
      type: 'https://iana.org/assignments/http-problem-types#mismatching-upload-offset',
      title: 'offset from request does not match offset of resource',
      'expected-offset': expected,
      'provided-offset': actual,
    });
  }

  private sendChecksumMismatchResponse(response: Response, assetId: string, path: string): Promise<void> {
    this.logger.warn(`Removing upload asset ${assetId} due to checksum mismatch`);
    response.status(460).send('Checksum mismatch');
    return this.removeAsset(assetId, path);
  }

  private requireUploadComplete(headers: Request['headers'], interopVersion: number | null): boolean {
    if (interopVersion !== null && interopVersion <= 3) {
      const value = headers['upload-incomplete'] as string | undefined;
      if (value === undefined) {
        throw new BadRequestException('Missing Upload-Incomplete header');
      }
      return value === '?0';
    }

    const value = headers['upload-complete'] as string | undefined;
    if (value === undefined) {
      throw new BadRequestException('Missing Upload-Complete header');
    }
    return value === '?1';
  }

  private getNumberHeader(headers: Request['headers'], name: string): number | null {
    const value = headers[name] as string | undefined;
    if (value === undefined) {
      return null;
    }
    const number = parseInt(value, 10);
    if (!isFinite(number) || number < 0) {
      throw new BadRequestException(`Invalid ${name} header`);
    }
    return number;
  }

  private requireContentLength(headers: Request['headers']): number {
    const value = headers['content-length'] as string | undefined;
    if (value === undefined) {
      throw new BadRequestException('Missing Content-Length header');
    }
    const length = parseInt(value, 10);
    if (!isFinite(length) || length < 0) {
      throw new BadRequestException('Invalid Content-Length header');
    }
    return length;
  }

  private async withRetry<T>(operation: () => Promise<T>, retries: number = 2, delay: number = 100): Promise<T> {
    let lastError: any;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
      }
      if (attempt < retries) {
        await setTimeout(delay);
      }
    }
    throw lastError;
  }

  private validateQuota(auth: AuthDto, size: number) {
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

  private requireChecksum(headers: Request['headers']): Buffer {
    const value = headers['repr-digest'] as string | undefined;
    if (value === undefined) {
      throw new BadRequestException(`Missing 'repr-digest' header`);
    }

    const sha1Item = parseDictionary(value).get('sha');
    if (!sha1Item) {
      throw new BadRequestException(`Missing 'sha' in 'repr-digest' header`);
    }

    const checksum = sha1Item[0];
    if (!(checksum instanceof ArrayBuffer)) {
      throw new BadRequestException(`Invalid 'sha' in 'repr-digest' header`);
    }

    return Buffer.from(checksum);
  }

  private requireAssetData(headers: Request['headers']): UploadAssetDataDto {
    const value = headers[ImmichHeader.AssetData] as string | undefined;
    if (value === undefined) {
      throw new BadRequestException(`Missing ${ImmichHeader.AssetData} header`);
    }

    let assetData: any;
    try {
      assetData = JSON.parse(Buffer.from(value, 'base64').toString('utf8'));
    } catch {
      throw new BadRequestException(`${ImmichHeader.AssetData} header is not valid base64-encoded JSON`);
    }

    const dto = plainToInstance(UploadAssetDataDto, assetData);
    const errors = validateSync(dto, { whitelist: true });
    if (errors.length > 0) {
      const formatted = errors.map((e) => (e.constraints ? Object.values(e.constraints).join(', ') : ''));
      throw new BadRequestException(`Invalid ${ImmichHeader.AssetData} header: ${formatted.join('; ')}`);
    }

    return dto;
  }

  private setCompleteHeader(response: Response, interopVersion: number | null, isComplete: boolean): void {
    if (!interopVersion) {
      return;
    }

    if (interopVersion > 3) {
      response.setHeader('Upload-Complete', isComplete ? '?1' : '?0');
    } else {
      response.setHeader('Upload-Incomplete', isComplete ? '?0' : '?1');
    }
  }
}
