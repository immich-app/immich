import { StorageCore, StorageFolder, UploadFile } from '@app/domain';
import { AuthService } from '@app/domain/auth/auth.service';
import { AssetService } from '@app/immich/api-v1/asset/asset.service';
import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { EVENTS, Upload } from '@tus/server';
import { NextFunction } from 'express';
import { IncomingMessage, ServerResponse } from 'http';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CreateAssetDto } from '../api-v1/asset/dto/create-asset.dto';
import { TusService } from '../api-v1/asset/tus.service';

@Injectable()
export class TusMiddleware implements NestMiddleware {
  private logger = new Logger(TusMiddleware.name);
  constructor(
    private tusService: TusService,
    private authService: AuthService,
    private assetService: AssetService,
  ) {}

  async use(req: IncomingMessage, res: ServerResponse<IncomingMessage>, next: NextFunction) {
    // Not sure if this endpoint will have auth information in the query, so let's write it like this
    const query: Record<string, string> = {};
    for (const [name, value] of new URLSearchParams(req.url)) {
      query[name] = value;
    }
    const user = await this.authService.validate(req.headers, query);

    // If the user doesn't exist, simply continue without uploading anything
    if (user == null) {
      next();
      return;
    }

    this.tusService.getServer(user.id, (server) => {
      server.addListener(EVENTS.POST_CREATE, (req, res, upload: Upload, url: string) => {
        this.logger.log(`Upload ${JSON.stringify(upload)}`);
        this.logger.log(`URL ${url}`);
      });

      server.addListener(EVENTS.POST_FINISH, (req, res, upload: Upload) => {
        const file = this.mapUploadToUploadFile(upload, user.id);
        const metadata = upload.metadata ?? {};
        const dto: CreateAssetDto = {
          deviceAssetId: metadata['deviceAssetId'] ?? '',
          deviceId: metadata['deviceId'] ?? '',
          fileCreatedAt: new Date(metadata['fileCreatedAt'] ?? ''),
          fileModifiedAt: new Date(metadata['fileModifiedAt'] ?? ''),
          isFavorite: (metadata['isFavorite'] ?? 'false') === 'true',
          duration: metadata['duration'] ?? '',
          assetData: new File([file.originalPath], metadata['filename'] ?? ''),
        };

        this.assetService.uploadFile(user, dto, file, undefined, undefined);
      });
    });

    await this.tusService.handleTus(req, res, user.id);
  }

  mapUploadToUploadFile(upload: Upload, userId: string): UploadFile {
    const uploadedPath = join(StorageCore.getBaseFolder(StorageFolder.TUS_PARTIAL), userId, upload.id);
    const hash = createHash('sha1');
    const fileBuffer = readFileSync(uploadedPath);
    hash.update(fileBuffer);
    return {
      checksum: hash.digest(),
      originalPath: uploadedPath,
      originalName: upload.metadata ? upload.metadata['filename'] ?? '' : '',
    };
  }
}
