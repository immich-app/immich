import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Request, Response } from 'express';
import { createHash } from 'node:crypto';
import { extname, join } from 'node:path';
import { StorageCore } from 'src/cores/storage.core';
import { AuthDto } from 'src/dtos/auth.dto';
import { UploadAssetDataDto } from 'src/dtos/upload.dto';
import { AssetStatus, AssetType, AssetVisibility, ImmichHeader, JobName, StorageFolder } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { isAssetChecksumConstraint } from 'src/utils/database';
import { mimeTypes } from 'src/utils/mime-types';
import { isInnerList, parseDictionary } from 'structured-headers';

@Injectable()
export class AssetUploadService extends BaseService {
  async handleInitialChunk(auth: AuthDto, request: Request, response: Response): Promise<void> {
    const headers = request.headers;
    const contentLength = this.getNumberOrThrow(headers, 'content-length');
    const isComplete = this.getIsCompleteOrThrow(headers);
    const checksumHeader = this.getChecksumOrThrow(headers);

    const metadata = this.getAssetDataOrThrow(headers);
    const assetId = this.cryptoRepository.randomUUID();
    const folder = StorageCore.getNestedFolder(StorageFolder.Upload, auth.user.id, assetId);
    const extension = extname(metadata.filename);
    const path = join(folder, `${assetId}${extension}`);
    const type = mimeTypes.assetType(path);
    if (type === AssetType.Other) {
      throw new BadRequestException(`${metadata.filename} is an unsupported file type`);
    }
    this.requireQuota(auth, contentLength);

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

        if (duplicate.status === AssetStatus.Partial) {
          response.status(201).setHeader('location', this.createLocation(headers, assetId)).send();
        } else {
          response.status(400).contentType('application/problem+json').send({
            type: 'https://iana.org/assignments/http-problem-types#completed-upload',
            title: 'upload is already completed',
          });
        }
        return;
      }
      this.logger.error(`Error creating upload asset record: ${error.message}`);
      response.status(500).send('Error creating upload asset record');
      return;
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
        return response.status(500).setHeader('location', this.createLocation(headers, assetId)).send();
      }
    });

    writeStream.on('finish', () => {
      if (!isComplete) {
        return response.status(201).setHeader('location', this.createLocation(headers, assetId)).send();
      }

      this.logger.log(`Finished upload to ${path}`);
      this.assertChecksum(checksumHeader, checksumBuffer!, path, assetId);
      response.status(201).setHeader('Upload-Complete', '?1').send();
      void this.onCompletion({
        assetId,
        ownerId: auth.user.id,
        path,
        size: contentLength,
        fileModifiedAt: metadata.fileModifiedAt,
      });
    });

    request.on('error', (error) => {
      this.logger.error(`Failed to read request body: ${error.message}`);
      writeStream.end();
      if (!response.headersSent) {
        return response.status(500).setHeader('location', this.createLocation(headers, assetId)).send();
      }
    });

    let receivedLength = 0;
    request.on('data', (chunk: Buffer) => {
      if (receivedLength + chunk.length > contentLength) {
        writeStream.destroy();
        request.destroy();
        this.onPermanentFailure(assetId, path);
        response.status(400).send('Received more data than specified in content-length');
      }
      receivedLength += chunk.length;
      if (!writeStream.write(chunk)) {
        request.pause();
        writeStream.once('drain', () => request.resume());
      }
    });

    request.on('end', () => {
      if (receivedLength !== contentLength) {
        this.logger.error(`Received ${receivedLength} bytes when expecting ${contentLength} for ${assetId}`);
        writeStream.destroy();
        this.onPermanentFailure(assetId, path);
      }
    });
  }

  async handleRemainingChunks(auth: AuthDto, assetId: string, request: Request, response: Response): Promise<void> {
    const headers = request.headers;
    const headerIsComplete = this.getIsCompleteOrThrow(headers);
    const contentLength = this.getNumberOrThrow(headers, 'content-length');
    await this.databaseRepository.withUuidLock(assetId, async () => {
      const asset = await this.assetRepository.getCompletionMetadata(assetId, auth.user.id);
      if (!asset) {
        response.status(404).send('Asset not found');
        return;
      }

      const { path } = asset;
      if (asset.status !== AssetStatus.Partial) {
        response.status(400).contentType('application/problem+json').send({
          type: 'https://iana.org/assignments/http-problem-types#completed-upload',
          title: 'upload is already completed',
        });
        return;
      }

      const providedOffset = this.getNumber(headers, 'upload-offset') ?? 0;
      const expectedOffset = await this.getCurrentOffset(path);

      if (expectedOffset !== providedOffset) {
        response.status(409).contentType('application/problem+json').setHeader('upload-complete', '?0').send({
          type: 'https://iana.org/assignments/http-problem-types#mismatching-upload-offset',
          title: 'offset from request does not match offset of resource',
          'expected-offset': expectedOffset,
          'provided-offset': providedOffset,
        });
      }

      const newLength = providedOffset + contentLength;
      this.requireQuota(auth, newLength);

      if (contentLength === 0) {
        response.status(204).send();
        return;
      }

      const writeStream = this.storageRepository.createOrAppendWriteStream(path);
      writeStream.on('error', (error) => {
        this.logger.error(`Failed to write chunk to ${path}: ${error.message}`);
        if (!response.headersSent) {
          response.status(500).send('Failed to write chunk');
        }
      });

      writeStream.on('finish', async () => {
        if (headerIsComplete) {
          this.logger.log(`Finished upload to ${path}`);
          const checksum = await this.cryptoRepository.hashFile(path);
          this.assertChecksum(asset.checksum, checksum, path, assetId);
          response.status(201).setHeader('upload-complete', '?1').send();
          await this.onCompletion({
            assetId,
            ownerId: auth.user.id,
            path,
            size: newLength,
            fileModifiedAt: asset.fileModifiedAt,
          });
        } else {
          response.status(204).send();
        }
      });

      let receivedLength = 0;
      request.on('data', (chunk: Buffer) => {
        if (receivedLength + chunk.length > contentLength) {
          this.logger.error(`Received more data than specified in content-length for upload to ${path}`);
          writeStream.destroy(new Error('Received more data than specified in content-length'));
          request.destroy();
          void this.onPermanentFailure(assetId, path);
          return;
        }

        receivedLength += chunk.length;
        if (!writeStream.write(chunk)) {
          request.pause();
          writeStream.once('drain', () => request.resume());
        }
      });

      request.on('end', () => {
        if (receivedLength < contentLength) {
          this.logger.error(`Received less data than specified in content-length for upload to ${path}`);
          writeStream.destroy(new Error('Received less data than specified in content-length'));
          void this.onPermanentFailure(assetId, path);
          return;
        }
        writeStream.end();
      });
    });
  }

  getUploadStatus(auth: AuthDto, assetId: string, request: Request, response: Response) {
    const headers = request.headers;
    const interopVersion = this.getInteropVersion(headers);
    return this.databaseRepository.withUuidLock(assetId, async () => {
      const asset = await this.assetRepository.getCompletionMetadata(assetId, auth.user.id);
      if (!asset) {
        response.status(404).send('Asset not found');
        return;
      }

      if (interopVersion !== null && interopVersion < 2) {
        response.setHeader('upload-incomplete', asset.status === AssetStatus.Partial ? '?1' : '?0');
      } else {
        response.setHeader('upload-complete', asset.status === AssetStatus.Partial ? '?0' : '?1');
      }

      response
        .status(204)
        .setHeader('upload-offset', await this.getCurrentOffset(asset.path))
        .send();
    });
  }

  private async onCompletion(data: {
    assetId: string;
    ownerId: string;
    path: string;
    size: number;
    fileModifiedAt: Date;
  }): Promise<void> {
    const { assetId, ownerId, path, size, fileModifiedAt } = data;
    const jobData = { name: JobName.AssetExtractMetadata, data: { id: assetId, source: 'upload' } } as const;
    await this.withRetry(() => this.assetRepository.setComplete(assetId, ownerId, size), 2);
    await this.withRetry(() => this.jobRepository.queue(jobData), 2);
    await this.withRetry(() => this.storageRepository.utimes(path, new Date(), fileModifiedAt), 2);
  }

  private async onPermanentFailure(assetId: string, path: string): Promise<void> {
    await this.withRetry(() => this.storageRepository.unlink(path), 2);
    await this.withRetry(() => this.assetRepository.remove({ id: assetId }), 2);
  }

  private async withRetry<T>(operation: () => Promise<T>, retries: number): Promise<T> {
    let lastError: any;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
      }
    }
    throw lastError;
  }

  private async tryUnlink(path: string): Promise<void> {
    try {
      await this.storageRepository.unlink(path);
    } catch {
      this.logger.warn(`Failed to remove file at ${path}`);
    }
  }

  private requireQuota(auth: AuthDto, size: number) {
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

  private getNumberOrThrow(headers: Request['headers'], header: string): number {
    const value = this.getNumber(headers, header);
    if (value === null) {
      throw new BadRequestException(`Missing ${header} header`);
    }
    return value;
  }

  private getNumber(headers: Request['headers'], header: string): number | null {
    const value = headers[header] as string | undefined;
    if (value === undefined) {
      return null;
    }

    const parsedValue = parseInt(value);
    if (!isFinite(parsedValue) || parsedValue < 0) {
      throw new BadRequestException(`Invalid ${header} header`);
    }
    return parsedValue;
  }

  private getChecksumOrThrow(headers: Request['headers']): Buffer {
    const value = headers['repr-digest'] as string | undefined;
    if (value === undefined) {
      throw new BadRequestException(`Missing 'repr-digest' header`);
    }

    const sha1Item = parseDictionary(value).get('sha');
    if (!sha1Item) {
      throw new BadRequestException(`Missing 'sha' in 'repr-digest' header`);
    }

    if (isInnerList(sha1Item)) {
      throw new BadRequestException(`Invalid 'sha' in 'repr-digest' header`);
    }
    const checksum = sha1Item[0];
    if (!(checksum instanceof ArrayBuffer)) {
      throw new BadRequestException(`Invalid 'sha' in 'repr-digest' header`);
    }

    return Buffer.from(checksum);
  }

  private getIsCompleteOrThrow(headers: Request['headers']): boolean {
    const isComplete = headers['upload-complete'] as string | undefined;
    if (isComplete !== undefined) {
      return isComplete === '?1';
    }

    // old drafts use this header
    const isIncomplete = headers['upload-incomplete'] as string | undefined;
    if (isIncomplete !== undefined) {
      return isIncomplete === '?0';
    }

    throw new BadRequestException(`Missing 'upload-complete' header`);
  }

  private getAssetDataOrThrow(headers: Request['headers']): UploadAssetDataDto {
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
    const assetDataErrors = validateSync(dto, { whitelist: true });
    if (assetDataErrors.length > 0) {
      const formatted = assetDataErrors.map((e) => (e.constraints ? Object.values(e.constraints).join(', ') : ''));
      throw new BadRequestException(`Invalid ${ImmichHeader.AssetData} header: ${formatted.join('; ')}`);
    }

    if (!mimeTypes.isAsset(dto.filename)) {
      throw new BadRequestException(`${dto.filename} is an unsupported file type`);
    }
    return dto;
  }

  private getInteropVersion(headers: Request['headers']): number | null {
    const value = headers['upload-draft-interop-version'] as string | undefined;
    if (value === undefined) {
      return null;
    }

    const parsedValue = parseInt(value);
    if (!isFinite(parsedValue) || parsedValue < 0) {
      throw new BadRequestException(`Invalid Upload-Draft-Interop-Version header`);
    }
    return parsedValue;
  }

  private createLocation(headers: Request['headers'], assetId: string): string {
    const forwardedProto = headers['x-forwarded-proto'] ?? 'http';
    return `${forwardedProto}://${this.getForwardedHost(headers)}/api/upload/asset/${assetId}`;
  }

  private assertChecksum(checksum1: Buffer, checksum2: Buffer, assetId: string, path: string): void {
    if (checksum1.compare(checksum2) !== 0) {
      this.logger.warn(`Checksum mismatch for upload to ${path}`);
      void this.onPermanentFailure(assetId, path);
      throw new BadRequestException('Checksum mismatch');
    }
  }

  private getForwardedHost(headers: Request['headers']): string | undefined {
    const forwardedHost = headers['x-forwarded-host'];
    if (typeof forwardedHost === 'string') {
      return forwardedHost;
    }

    const forwarded = headers['forwarded'] as string | undefined;
    if (forwarded) {
      const parts = parseDictionary(forwarded);
      const hostItem = parts.get('host');
      if (hostItem && !isInnerList(hostItem)) {
        const item = hostItem[0];
        if (typeof item === 'string') {
          return item;
        }
      }
    }

    const { host, port } = this.configRepository.getEnv();
    return `${host ?? 'localhost'}:${port}`;
  }
}
