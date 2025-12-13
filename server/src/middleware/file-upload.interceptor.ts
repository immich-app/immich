import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { transformException } from '@nestjs/platform-express/multer/multer/multer.utils';
import { NextFunction, RequestHandler } from 'express';
import multer, { StorageEngine, diskStorage } from 'multer';
import { createHash, randomUUID } from 'node:crypto';
import { Observable } from 'rxjs';
import { UploadFieldName } from 'src/dtos/asset-media.dto';
import { RouteKey } from 'src/enum';
import { AuthRequest } from 'src/middleware/auth.guard';
import { LoggingRepository } from 'src/repositories/logging.repository';
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

type DiskStorageCallback = (error: Error | null, result: string) => void;

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
  private defaultStorage: StorageEngine;

  constructor(
    private reflect: Reflector,
    private assetService: AssetMediaService,
    private logger: LoggingRepository,
  ) {
    this.logger.setContext(FileUploadInterceptor.name);

    this.defaultStorage = diskStorage({
      filename: this.filename.bind(this),
      destination: this.destination.bind(this),
    });

    const instance = multer({
      fileFilter: this.fileFilter.bind(this),
      storage: {
        _handleFile: this.handleFile.bind(this),
        _removeFile: this.removeFile.bind(this),
      },
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

  private filename(request: AuthRequest, file: Express.Multer.File, callback: DiskStorageCallback) {
    return callbackify(
      () => this.assetService.getUploadFilename(asUploadRequest(request, file)),
      callback as Callback<string>,
    );
  }

  private destination(request: AuthRequest, file: Express.Multer.File, callback: DiskStorageCallback) {
    return callbackify(
      () => this.assetService.getUploadFolder(asUploadRequest(request, file)),
      callback as Callback<string>,
    );
  }

  private handleFile(request: AuthRequest, file: Express.Multer.File, callback: Callback<Partial<ImmichFile>>) {
    (file as ImmichMulterFile).uuid = randomUUID();

    request.on('error', (error) => {
      this.logger.warn('Request error while uploading file, cleaning up', error);
      this.assetService.onUploadError(request, file).catch(this.logger.error);
    });

    if (!this.isAssetUploadFile(file)) {
      this.defaultStorage._handleFile(request, file, callback);
      return;
    }

    const hash = createHash('sha1');
    file.stream.on('data', (chunk) => hash.update(chunk));
    this.defaultStorage._handleFile(request, file, (error, info) => {
      if (error) {
        hash.destroy();
        callback(error);
      } else {
        callback(null, { ...info, checksum: hash.digest() });
      }
    });
  }

  private removeFile(request: AuthRequest, file: Express.Multer.File, callback: (error: Error | null) => void) {
    this.defaultStorage._removeFile(request, file, callback);
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
