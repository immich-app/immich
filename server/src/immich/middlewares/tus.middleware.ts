import { AssetService, StorageCore, StorageFolder, UploadFieldName, UploadFile } from '@app/domain';
import { AuthService } from '@app/domain/auth/auth.service';
import { AssetService as AssetServiceV1 } from '@app/immich/api-v1/asset/asset.service';
import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { EVENTS, Upload } from '@tus/server';
import { plainToInstance } from 'class-transformer';
import { NextFunction } from 'express';
import { IncomingMessage, ServerResponse } from 'http';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CreateAssetDto, CreateTusAssetDto } from '../api-v1/asset/dto/create-asset.dto';
import { TusService } from '../api-v1/asset/tus.service';

@Injectable()
export class TusMiddleware implements NestMiddleware {
  private logger = new Logger(TusMiddleware.name);
  constructor(
    private tusService: TusService,
    private authService: AuthService,
    private assetV1Service: AssetServiceV1,
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

    // In the protocol, POST is the start of the upload
    if (req.method == 'POST') {
      this.assetService.canUploadFile({
        authUser: user,
        fieldName: UploadFieldName.ASSET_DATA,
        // File is mostly stubbed, as we don't have a lot to go with
        file: {
          checksum: Buffer.from(''),
          originalPath: '',
          originalName: this.tusService.getFilename(req),
        },
      });
    }

    this.tusService.getServer(user.id, (server) => {
      server.addListener(EVENTS.POST_FINISH, async (req, res, upload: Upload) => {
        const file = this.mapUploadToUploadFile(upload, user.id);
        if (await this.tusService.validateMetadata(upload)) {
          const dto: CreateAssetDto = plainToInstance(CreateTusAssetDto, upload.metadata);
        // TODO async stuff?
        await this.assetV1Service.uploadFile(user, dto, file, undefined, undefined);
        }
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
