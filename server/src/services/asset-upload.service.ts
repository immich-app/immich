import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Request, Response } from 'express';
import { ChildProcess, spawn } from 'node:child_process';
import { request as httpRequest } from 'node:http';
import { createConnection } from 'node:net';
import { extname, join, parse, resolve } from 'node:path';
import {
  UPLOAD_CHUNK_DIRECTORY,
  UPLOAD_TUSD_CONNECT_BACKOFF_MS,
  UPLOAD_TUSD_CONNECT_RETRIES,
  UPLOAD_TUSD_CONNECT_TIMEOUT_MS,
  UPLOAD_TUSD_SOCKET_PATH,
} from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import { OnEvent } from 'src/decorators';
import { AssetMediaStatus } from 'src/dtos/asset-media-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  TusdHookResponseDto,
  TusdPreCreateEventDto,
  TusdPreFinishEventDto,
  UploadAssetDataDto,
} from 'src/dtos/upload.dto';
import { AssetVisibility, ImmichHeader, ImmichWorker, JobName, StorageFolder } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { isAssetChecksumConstraint } from 'src/utils/database';
import { mimeTypes } from 'src/utils/mime-types';
import { fromChecksum } from 'src/utils/request';

@Injectable()
export class AssetUploadService extends BaseService {
  private tusdProcess?: ChildProcess;

  @OnEvent({ name: 'AppBootstrap', workers: [ImmichWorker.Api] })
  async onBootstrap() {
    await this.storageRepository.unlinkDir(UPLOAD_CHUNK_DIRECTORY, { recursive: true, force: true });
    await this.storageRepository.mkdir(UPLOAD_CHUNK_DIRECTORY);
    const { host, port } = this.configRepository.getEnv();

    const args = [
      '-unix-sock',
      UPLOAD_TUSD_SOCKET_PATH,
      '--base-path',
      '/api/upload/asset',
      '--upload-dir',
      UPLOAD_CHUNK_DIRECTORY,
      '--hooks-http',
      `http://${host ?? 'localhost'}:${port}:/api/upload/hook`,
      '--hooks-enabled-events',
      'pre-create,pre-finish',
      '--behind-proxy',
      '-enable-experimental-protocol',
      '-shutdown-timeout',
      '5s',
      '-hooks-http-forward-headers',
      Object.values(ImmichHeader).join(',') + ',authorization',
      '-disable-download',
      '-disable-termination',
    ];

    this.logger.log(`Starting tusd server with args: ${args.join(' ')}`);

    this.tusdProcess = spawn('tusd', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    this.tusdProcess.stdout?.on('data', (data) => this.logger.verboseFn(() => `tusd: ${data.toString().trim()}`));

    this.tusdProcess.stderr?.on('data', (data) => this.logger.warn(`tusd: ${data.toString().trim()}`));

    this.tusdProcess.on('error', (error) => {
      this.logger.error(`tusd failed to start: ${error.message}`);
      process.exit(1);
    });

    this.tusdProcess.on('exit', async (code) => {
      this.tusdProcess = undefined;
      try {
        await Promise.all([
          this.storageRepository.unlink(UPLOAD_TUSD_SOCKET_PATH),
          this.storageRepository.unlinkDir(UPLOAD_CHUNK_DIRECTORY, { recursive: true, force: true }),
        ]);
      } finally {
        if (code) {
          this.logger.error(`tusd exited unexpectedly with code ${code}`);
          // TODO: more graceful shutdown
          process.exit(code);
        }
      }
    });

    this.logger.log('Waiting for tusd server...');
    await this.waitForTusd(UPLOAD_TUSD_SOCKET_PATH);
    this.logger.log('tusd server started successfully');
  }

  @OnEvent({ name: 'AppShutdown' })
  onShutdown() {
    this.tusdProcess?.kill('SIGTERM');
    this.tusdProcess = undefined;
  }

  async proxyChunks(request: Request, response: Response): Promise<unknown> {
    if (!this.tusdProcess) {
      throw new InternalServerErrorException('tusd server is not running');
    }

    delete request.headers.host;
    request.headers.connection = 'close'; // not sure why, but it doesn't respond for 60 seconds without this
    return new Promise((resolve, reject) => {
      const proxyReq = httpRequest(
        {
          socketPath: UPLOAD_TUSD_SOCKET_PATH,
          path: request.url,
          method: request.method,
          headers: request.headers,
        },
        (proxyRes) => {
          response.status(proxyRes.statusCode || 200);
          for (const [key, value] of Object.entries(proxyRes.headers)) {
            if (value !== undefined) {
              response.setHeader(key, value);
            }
          }

          proxyRes.pipe(response);
          proxyRes.on('end', resolve);
          proxyRes.on('error', reject);
        },
      );

      proxyReq.on('error', (error: any) => {
        this.logger.error(`Failed to proxy to tusd: ${error.message}`);
        reject(new InternalServerErrorException('Upload service unavailable'));
      });

      if (request.readable) {
        request.pipe(proxyReq);
      } else {
        proxyReq.end();
      }
    });
  }

  private async waitForTusd(socketPath: string, maxRetries = UPLOAD_TUSD_CONNECT_RETRIES): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      const ready = await new Promise<boolean>((resolve) => {
        const socket = createConnection(socketPath, () => {
          socket.end();
          resolve(true);
        });

        socket.on('error', () => {
          resolve(false);
        });

        socket.setTimeout(UPLOAD_TUSD_CONNECT_TIMEOUT_MS);
        socket.on('timeout', () => {
          socket.destroy();
          resolve(false);
        });
      });

      if (ready) {
        return;
      }

      await new Promise((r) => setTimeout(r, UPLOAD_TUSD_CONNECT_BACKOFF_MS));
    }

    throw new Error('tusd server failed to start within timeout');
  }

  async handlePreCreate(
    auth: AuthDto,
    payload: TusdPreCreateEventDto,
    headers: Record<string, string>,
  ): Promise<TusdHookResponseDto> {
    this.logger.debugFn(() => `PreCreate hook received: ${JSON.stringify(payload)}`);
    const checksum = headers[ImmichHeader.Checksum]?.[0];
    if (checksum) {
      const existingId = await this.assetRepository.getUploadAssetIdByChecksum(auth.user.id, fromChecksum(checksum));
      if (existingId) {
        const body = JSON.stringify({ status: AssetMediaStatus.DUPLICATE, id: existingId });
        return {
          RejectUpload: true,
          HTTPResponse: { StatusCode: 200, Body: body },
        };
      }
    }

    this.requireQuota(auth, payload.Upload.Size);
    const encodedAssetData = headers[ImmichHeader.AssetData];
    if (!encodedAssetData) {
      throw new BadRequestException(`Missing ${ImmichHeader.AssetData} header`);
    }

    const assetData = this.parseMetadata(encodedAssetData);
    this.logger.log('assetData: ' + JSON.stringify(assetData));

    const assetId = this.cryptoRepository.randomUUID();
    const folder = StorageCore.getNestedFolder(StorageFolder.Upload, auth.user.id, assetId);
    const extension = extname(assetId);
    const path = join(folder, `${assetId}${extension}`);
    return {
      ChangeFileInfo: {
        ID: assetId,
        Storage: { Path: path },
        MetaData: {
          AssetData: encodedAssetData,
        },
      },
    };
  }

  async handlePreFinish(auth: AuthDto, dto: TusdPreFinishEventDto): Promise<TusdHookResponseDto> {
    this.logger.debugFn(() => `PreFinish hook received: ${JSON.stringify(dto)}`);
    const {
      Upload: {
        MetaData: { AssetData: encodedAssetData },
        Storage: { Path: path },
        Size: size,
        ID: assetId,
      },
    } = dto;

    const parsedPath = parse(resolve(path));
    if (!parsedPath.dir.startsWith(StorageCore.getFolderLocation(StorageFolder.Upload, auth.user.id))) {
      throw new BadRequestException('Path is not in user folder');
    }
    const metadata = this.parseMetadata(encodedAssetData);

    try {
      this.requireQuota(auth, size);
      const checksum = await this.cryptoRepository.hashFile(path);
      await this.storageRepository.utimes(path, new Date(), new Date(metadata.fileModifiedAt));
      try {
        await this.assetRepository.create({
          id: assetId,
          ownerId: auth.user.id,
          libraryId: null,
          checksum,
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
          originalFileName: metadata.filename || parsedPath.base,
        });
      } catch (error: any) {
        if (isAssetChecksumConstraint(error)) {
          const duplicateId = await this.assetRepository.getUploadAssetIdByChecksum(auth.user.id, checksum);
          if (!duplicateId) {
            this.logger.error(`Error locating duplicate for checksum constraint`);
            throw new InternalServerErrorException();
          }
          void this.tryUnlink(path);
          const body = JSON.stringify({ id: duplicateId, status: AssetMediaStatus.DUPLICATE });
          return { HTTPResponse: { StatusCode: 200, Body: body } };
        }
      }
    } catch (error: any) {
      void this.tryUnlink(path);
      throw error;
    }

    await this.userRepository.updateUsage(auth.user.id, size);
    await this.assetRepository.upsertExif({ assetId: assetId, fileSizeInByte: size });
    await this.jobRepository.queue({
      name: JobName.AssetExtractMetadata,
      data: { id: assetId, source: 'upload' },
    });

    this.logger.log(`Asset created from chunked upload: ${assetId}`);
    const body = JSON.stringify({ id: assetId, status: AssetMediaStatus.CREATED });
    return { HTTPResponse: { StatusCode: 201, Body: body } };
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

  private parseMetadata(encodedAssetData: string): UploadAssetDataDto {
    let assetData: any;
    try {
      assetData = JSON.parse(Buffer.from(encodedAssetData, 'base64').toString('utf8'));
    } catch {
      throw new BadRequestException(`Invalid ${ImmichHeader.AssetData} header`);
    }
    const dto = plainToInstance(UploadAssetDataDto, assetData);
    const assetDataErrors = validateSync(dto, { whitelist: true });
    if (assetDataErrors.length > 0 || !mimeTypes.isAsset(assetData.filename)) {
      throw new BadRequestException(`Invalid ${ImmichHeader.AssetData} header`);
    }
    return dto;
  }
}
