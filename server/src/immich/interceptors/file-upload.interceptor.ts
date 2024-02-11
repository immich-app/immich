import { AssetService, UploadFieldName, UploadFile } from '@app/domain';
import { ImmichLogger } from '@app/infra/logger';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { transformException } from '@nestjs/platform-express/multer/multer/multer.utils';
import { NextFunction, RequestHandler } from 'express';
import multer, { StorageEngine, diskStorage } from 'multer';
import { createHash, randomUUID } from 'node:crypto';
import { Observable } from 'rxjs';
import { AuthRequest } from '../app.guard';

export enum Route {
  ASSET = 'asset',
  USER = 'user',
}

export interface ImmichFile extends Express.Multer.File {
  /** sha1 hash of file */
  uuid: string;
  checksum: Buffer;
}

export function mapToUploadFile(file: ImmichFile): UploadFile {
  return {
    uuid: file.uuid,
    checksum: file.checksum,
    originalPath: file.path,
    originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'),
    size: file.size,
  };
}

type DiskStorageCallback = (error: Error | null, result: string) => void;

type ImmichMulterFile = Express.Multer.File & { uuid: string };

interface Callback<T> {
  (error: Error): void;
  (error: null, result: T): void;
}

const callbackify = async <T>(target: (...arguments_: any[]) => T, callback: Callback<T>) => {
  try {
    return callback(null, await target());
  } catch (error: Error | any) {
    return callback(error);
  }
};

const asRequest = (request: AuthRequest, file: Express.Multer.File) => {
  return {
    auth: request.user || null,
    fieldName: file.fieldname as UploadFieldName,
    file: mapToUploadFile(file as ImmichFile),
  };
};

@Injectable()
export class FileUploadInterceptor implements NestInterceptor {
  private logger = new ImmichLogger(FileUploadInterceptor.name);

  private handlers: {
    userProfile: RequestHandler;
    assetUpload: RequestHandler;
  };
  private defaultStorage: StorageEngine;

  constructor(
    private reflect: Reflector,
    private assetService: AssetService,
  ) {
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
        { name: UploadFieldName.LIVE_PHOTO_DATA, maxCount: 1 },
        { name: UploadFieldName.SIDECAR_DATA, maxCount: 1 },
      ]),
    };
  }

  async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
    const context_ = context.switchToHttp();
    const route = this.reflect.get<string>(PATH_METADATA, context.getClass());

    const handler: RequestHandler | null = this.getHandler(route as Route);
    if (handler) {
      await new Promise<void>((resolve, reject) => {
        const next: NextFunction = (error) => (error ? reject(transformException(error)) : resolve());
        handler(context_.getRequest(), context_.getResponse(), next);
      });
    } else {
      this.logger.warn(`Skipping invalid file upload route: ${route}`);
    }

    return next.handle();
  }

  private fileFilter(request: AuthRequest, file: Express.Multer.File, callback: multer.FileFilterCallback) {
    return callbackify(() => this.assetService.canUploadFile(asRequest(request, file)), callback);
  }

  private filename(request: AuthRequest, file: Express.Multer.File, callback: DiskStorageCallback) {
    return callbackify(
      () => this.assetService.getUploadFilename(asRequest(request, file)),
      callback as Callback<string>,
    );
  }

  private destination(request: AuthRequest, file: Express.Multer.File, callback: DiskStorageCallback) {
    return callbackify(() => this.assetService.getUploadFolder(asRequest(request, file)), callback as Callback<string>);
  }

  private handleFile(request: AuthRequest, file: Express.Multer.File, callback: Callback<Partial<ImmichFile>>) {
    (file as ImmichMulterFile).uuid = randomUUID();
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
      case UploadFieldName.ASSET_DATA:
      case UploadFieldName.LIVE_PHOTO_DATA: {
        return true;
      }
    }

    return false;
  }

  private getHandler(route: Route) {
    switch (route) {
      case Route.ASSET: {
        return this.handlers.assetUpload;
      }

      case Route.USER: {
        return this.handlers.userProfile;
      }

      default: {
        return null;
      }
    }
  }
}
