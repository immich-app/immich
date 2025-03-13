import {
  Body,
  CallHandler,
  Controller,
  ExecutionContext,
  Get,
  HttpStatus,
  Injectable,
  NestInterceptor,
  Param,
  ParseFilePipe,
  Post,
  Put,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { transformException } from '@nestjs/platform-express/multer/multer/multer.utils';
import { ApiBody, ApiConsumes, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsNumberString, IsString } from 'class-validator';
import { NextFunction, RequestHandler, Response } from 'express';
import { glob } from 'fast-glob';
import multer, { diskStorage, StorageEngine } from 'multer';
import { randomUUID } from 'node:crypto';
import { open } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { Observable } from 'rxjs';
import { APP_MEDIA_LOCATION } from 'src/constants';
import { AssetMediaResponseDto, AssetMediaStatus } from 'src/dtos/asset-media-response.dto';
import { AssetMediaCreateDto, UploadFieldName } from 'src/dtos/asset-media.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { Auth, Authenticated, AuthRequest } from 'src/middleware/auth.guard';
import { getFiles } from 'src/middleware/file-upload.interceptor';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { StorageRepository } from 'src/repositories/storage.repository';
import { AssetMediaService } from 'src/services/asset-media.service';
import { UploadFile, UploadFiles } from 'src/types';
import { requireUploadAccess } from 'src/utils/access';
import { asRequest } from 'src/utils/asset.util';

interface Callback<T> {
  (error: Error): void;
  (error: null, result: T): void;
}

type DiskStorageCallback = (error: Error | null, result: string) => void;

type HandleFileCallback = (error?: any, info?: Partial<Express.Multer.File>) => void;

const callbackify = <T>(target: (...arguments_: any[]) => T, callback: Callback<T>) => {
  try {
    return callback(null, target());
  } catch (error: Error | any) {
    return callback(error);
  }
};

@Injectable()
export class PartUploadInterceptor implements NestInterceptor {
  private handler: RequestHandler;
  private defaultStorage: StorageEngine;

  constructor(
    private logger: LoggingRepository,
    private storageRepository: StorageRepository,
  ) {
    this.logger.setContext(PartUploadInterceptor.name);

    this.defaultStorage = diskStorage({
      filename: this.filename.bind(this),
      destination: this.destination.bind(this),
    });

    const instance = multer({
      storage: {
        _handleFile: this.handleFile.bind(this),
        _removeFile: this.removeFile.bind(this),
      },
    });

    this.handler = instance.fields([{ name: 'partData', maxCount: 1 }]);
  }

  private filename(request: AuthRequest, file: Express.Multer.File, callback: DiskStorageCallback) {
    callback(null, String(request.params.partNo));
  }

  private destination(request: AuthRequest, file: Express.Multer.File, callback: DiskStorageCallback) {
    callbackify(() => {
      requireUploadAccess(request.user!);
      // TODO - move to a service
      // TODO - sanitise path parts
      const dir = join(APP_MEDIA_LOCATION, 'upload-part', request.user!.user.id, request.params.sha1);
      this.storageRepository.mkdirSync(dir);

      return dir;
    }, callback as Callback<string>);
  }

  private handleFile(request: AuthRequest, file: Express.Multer.File, callback: HandleFileCallback) {
    request.on('error', (error) => {
      this.logger.warn('Request error while uploading file, NOT cleaning up', error);
      // TODO - add the actual cleanup
    });

    this.defaultStorage._handleFile(request, file, callback);
  }

  private removeFile(request: AuthRequest, file: Express.Multer.File, callback: (error: Error | null) => void) {
    this.logger.log('removeFile');
    this.defaultStorage._removeFile(request, file, callback);
  }

  async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
    const context_ = context.switchToHttp();

    await new Promise<void>((resolve, reject) => {
      const next: NextFunction = (error) => {
        if (error) {
          reject(transformException(error));
        } else {
          resolve();
        }
      };
      this.handler(context_.getRequest(), context_.getResponse(), next);
    });

    return next.handle();
  }
}

@Injectable()
export class SidecarUploadInterceptor implements NestInterceptor {
  private handler: RequestHandler;
  private defaultStorage: StorageEngine;

  constructor(
    private logger: LoggingRepository,
    private storageRepository: StorageRepository,
    private assetService: AssetMediaService,
  ) {
    this.logger.setContext(SidecarUploadInterceptor.name);

    this.defaultStorage = diskStorage({
      filename: this.filename.bind(this),
      destination: this.destination.bind(this),
    });

    const instance = multer({
      storage: {
        _handleFile: this.handleFile.bind(this),
        _removeFile: this.removeFile.bind(this),
      },
    });

    this.handler = instance.fields([{ name: 'sidecarData', maxCount: 1 }]);
  }

  private filename(request: AuthRequest, file: Express.Multer.File, callback: any) {
    return callbackify(() => this.assetService.canUploadFile(asRequest(request, file)), callback);
  }

  private destination(request: AuthRequest, file: Express.Multer.File, callback: any) {
    return callbackify(
      () => this.assetService.getUploadFilename(asRequest(request, file)),
      callback as Callback<string>,
    );
  }

  private handleFile(request: AuthRequest, file: Express.Multer.File, callback: any) {
    request.on('error', (error) => {
      this.logger.warn('Request error while uploading file, NOT cleaning up', error);
      // TODO - add the actual cleanup
    });

    this.defaultStorage._handleFile(request, file, callback);
  }

  private removeFile(request: AuthRequest, file: Express.Multer.File, callback: (error: Error | null) => void) {
    this.logger.log('removeFile');
    this.defaultStorage._removeFile(request, file, callback);
  }

  async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
    const context_ = context.switchToHttp();

    await new Promise<void>((resolve, reject) => {
      const next: NextFunction = (error) => {
        if (error) {
          reject(transformException(error));
        } else {
          resolve();
        }
      };
      this.handler(context_.getRequest(), context_.getResponse(), next);
    });

    return next.handle();
  }
}

interface UploadParts {
  partData: Express.Multer.File[];
}

export class AssetMediaCreateFromPartsDto extends AssetMediaCreateDto {
  @IsNumberString()
  parts!: string;

  @IsString()
  originalName!: string;
}

export class PartInfoDto {
  @ApiProperty({ type: 'integer' })
  part!: number;

  @ApiProperty({ type: 'integer' })
  size!: number;

  // TODO - add sha1?
}

@ApiTags('Asset')
@Controller('asset-parts')
export class AssetPartController {
  constructor(
    private logger: LoggingRepository,
    private storageRepository: StorageRepository,
    private service: AssetMediaService,
  ) {}

  @Get(':sha1')
  @Authenticated()
  async getParts(
    @Auth() auth: AuthDto,
    @Param('sha1') sha1: string, // TODO - add validation
  ): Promise<PartInfoDto[]> {
    requireUploadAccess(auth);

    // no need to check if the folder exists - glob result will be [].

    const pattern = join(APP_MEDIA_LOCATION, 'upload-part', auth.user.id, sha1, '[0-9]*');

    const files = await glob(pattern, {
      absolute: true,
      caseSensitiveMatch: false,
      onlyFiles: true,
      dot: false,
    });

    const parts = files.map(async (file) => {
      const stats = await this.storageRepository.stat(file);
      return {
        part: +basename(file),
        size: stats.size,
      } as PartInfoDto;
    });

    this.logger.log('getParts', sha1, files.length);

    return await Promise.all(parts);
  }

  @Put(':sha1/:partNo')
  @UseInterceptors(PartUploadInterceptor)
  @ApiConsumes('multipart/form-data')
  @Authenticated()
  uploadPart(
    @Auth() auth: AuthDto,
    @Param('sha1') sha1: string, // TODO - add validation
    @Param('partNo') partNo: number, // TODO - add validation
    @UploadedFiles(new ParseFilePipe()) files: UploadParts,
    @Res({ passthrough: true }) res: Response,
  ) {
    const part = files.partData[0];

    // TODO - if partNo == 0 => check if an asset with sha1 already exists,
    // in which case return 200, to avoid uploading remaining parts.

    this.logger.log(`uploadPart ${sha1}/${partNo} -> ${part.path}`);

    res.status(HttpStatus.CREATED);
  }

  @Post(':sha1')
  @UseInterceptors(SidecarUploadInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'Asset Upload Information', type: AssetMediaCreateFromPartsDto })
  @Authenticated({ sharedLink: true })
  async createAssetFromParts(
    @Auth() auth: AuthDto,
    @Param('sha1') sha1: string, // TODO - add validation
    @UploadedFiles(new ParseFilePipe({ fileIsRequired: false })) files: UploadFiles,
    @Body() dto: AssetMediaCreateFromPartsDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AssetMediaResponseDto> {
    requireUploadAccess(auth);
    const { sidecarFile } = getFiles(files);

    // TODO - move it all to a service

    const idir = join(APP_MEDIA_LOCATION, 'upload-part', auth.user.id, sha1);

    const response = await this.service.getUploadAssetIdByChecksum(auth, sha1);
    if (response) {
      this.logger.log(`unlinking ${idir}`);
      await this.storageRepository.unlinkDir(idir, { recursive: true });

      res.status(HttpStatus.OK);
      return { status: AssetMediaStatus.DUPLICATE, id: response.id };
    }

    const ufile: UploadFile = {
      uuid: randomUUID(),
      checksum: Buffer.from(sha1, 'hex'),
      originalName: dto.originalName,
      originalPath: '',
      size: 0,
    };

    const req = { auth, fieldName: UploadFieldName.ASSET_DATA, file: ufile };
    const newDir = this.service.getUploadFolder(req);
    const newName = this.service.getUploadFilename(req);
    ufile.originalPath = join(newDir, newName);

    try {
      const ofd = await open(ufile.originalPath, 'w');

      try {
        const buff = Buffer.alloc(1024 * 100);

        for (let i = 0; i < +dto.parts; i++) {
          const p = join(idir, `${i}`);
          const ifd = await open(p, 'r');
          try {
            for (;;) {
              const rc = await ifd.read(buff);
              await ofd.write(buff, 0, rc.bytesRead);

              ufile.size += rc.bytesRead;

              if (rc.bytesRead < buff.length) {
                break;
              }
            }
          } finally {
            await ifd.close();
          }
        }
      } finally {
        await ofd.close();
      }

      this.logger.log('dto', dto);
      this.logger.log('ufile', ufile);

      const responseDto = await this.service.uploadAsset(auth, dto, ufile, sidecarFile);

      // delay removing the parts untill we successfully created an asset
      this.logger.log(`unlinking ${idir}`);
      await this.storageRepository.unlinkDir(idir, { recursive: true });

      if (responseDto.status === AssetMediaStatus.DUPLICATE) {
        res.status(HttpStatus.OK);
      } else {
        res.status(HttpStatus.CREATED);
      }

      return responseDto;
    } catch (error) {
      // cleanup the concatenated file on botched attempt
      await this.storageRepository.unlink(ufile.originalPath);
      throw error;
    }
  }
}
