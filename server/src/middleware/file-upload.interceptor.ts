import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { transformException } from '@nestjs/platform-express/multer/multer/multer.utils';
import { NextFunction, RequestHandler } from 'express';
import multer, { StorageEngine } from 'multer';
import { randomUUID } from 'node:crypto';
import { Observable } from 'rxjs';
import { UploadFieldName } from 'src/dtos/asset-media.dto';
import { RouteKey } from 'src/enum';
import { AuthRequest } from 'src/middleware/auth.guard';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { StorageRepository } from 'src/repositories/storage.repository';
import { AssetMediaService } from 'src/services/asset-media.service';
import { ImmichFile, UploadFile, UploadFiles } from 'src/types';
import { asUploadRequest, mapToUploadFile } from 'src/utils/asset.util';

export function getFile(files: UploadFiles, property: 'assetData' | 'sidecarData') {
  const file = files[property]?.[0];
  return file ? mapToUploadFile(file) : file;
}

export function getFiles(files: UploadFiles) {
  return {
    file: getFile(files, 'assetData') as UploadFile,
    sidecarFile: getFile(files, 'sidecarData'),
  };
}

type ImmichMulterFile = Express.Multer.File & { uuid: string };

interface Callback<T> {
  (error: Error): void;
  (error: null, result: T): void;
}

const callbackify = <T>(target: (...arguments_: any[]) => T, callback: Callback<T>) => {
  try {
    return callback(null, target());
  } catch (error: Error | any) {
    return callback(error);
  }
};

@Injectable()
export class FileUploadInterceptor implements NestInterceptor {
  private handlers: {
    userProfile: RequestHandler;
    assetUpload: RequestHandler;
  };
  private multerStorage: StorageEngine;

  constructor(
    private reflect: Reflector,
    private assetService: AssetMediaService,
    private storageRepository: StorageRepository,
    private logger: LoggingRepository,
  ) {
    this.logger.setContext(FileUploadInterceptor.name);

    // Create custom storage engine that delegates to StorageRepository
    this.multerStorage = {
      _handleFile: this.handleFile.bind(this),
      _removeFile: this.removeFile.bind(this),
    };

    const instance = multer({
      fileFilter: this.fileFilter.bind(this),
      storage: this.multerStorage,
    });

    this.handlers = {
      userProfile: instance.single(UploadFieldName.PROFILE_DATA),
      assetUpload: instance.fields([
        { name: UploadFieldName.ASSET_DATA, maxCount: 1 },
        { name: UploadFieldName.SIDECAR_DATA, maxCount: 1 },
      ]),
    };
  }

  async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
    const context_ = context.switchToHttp();
    const route = this.reflect.get<string>(PATH_METADATA, context.getClass());

    const handler: RequestHandler | null = this.getHandler(route as RouteKey);
    if (handler) {
      await new Promise<void>((resolve, reject) => {
        const next: NextFunction = (error) => (error ? reject(transformException(error)) : resolve());
        const maybePromise = handler(context_.getRequest(), context_.getResponse(), next);
        Promise.resolve(maybePromise).catch((error) => reject(error));
      });
    } else {
      this.logger.warn(`Skipping invalid file upload route: ${route}`);
    }

    return next.handle();
  }

  private fileFilter(request: AuthRequest, file: Express.Multer.File, callback: multer.FileFilterCallback) {
    return callbackify(() => this.assetService.canUploadFile(asUploadRequest(request, file)), callback);
  }

  private handleFile(request: AuthRequest, file: Express.Multer.File, callback: Callback<Partial<ImmichFile>>) {
    (file as ImmichMulterFile).uuid = randomUUID();

    request.on('error', (error) => {
      this.logger.warn('Request error while uploading file, cleaning up', error);
      this.assetService.onUploadError(request, file).catch(this.logger.error);
    });

    // Get destination folder and filename from AssetMediaService
    const uploadRequest = asUploadRequest(request, file);
    const folder = this.assetService.getUploadFolder(uploadRequest);
    const filename = this.assetService.getUploadFilename(uploadRequest);
    const destination = `${folder}/${filename}`;

    // Determine if we should compute checksum (only for asset files, not profile images)
    const shouldComputeChecksum = this.isAssetUploadFile(file);

    // Upload using StorageRepository
    this.storageRepository
      .uploadFromStream(file.stream, destination, { computeChecksum: shouldComputeChecksum })
      .then((result) => {
        callback(null, {
          path: result.path,
          size: result.size,
          checksum: result.checksum,
        });
      })
      .catch((error) => {
        this.logger.error(`Error uploading file: ${error.message}`, error.stack);
        callback(error);
      });
  }

  private removeFile(_request: AuthRequest, file: Express.Multer.File, callback: (error: Error | null) => void) {
    // If the file was uploaded, remove it
    if (file.path) {
      this.storageRepository
        .unlink(file.path)
        .then(() => callback(null))
        .catch((error) => {
          this.logger.error(`Error removing file: ${error.message}`, error.stack);
          callback(error);
        });
    } else {
      callback(null);
    }
  }

  private isAssetUploadFile(file: Express.Multer.File) {
    switch (file.fieldname as UploadFieldName) {
      case UploadFieldName.ASSET_DATA: {
        return true;
      }
    }

    return false;
  }

  private getHandler(route: RouteKey) {
    switch (route) {
      case RouteKey.Asset: {
        return this.handlers.assetUpload;
      }

      case RouteKey.User: {
        return this.handlers.userProfile;
      }

      default: {
        return null;
      }
    }
  }
}
