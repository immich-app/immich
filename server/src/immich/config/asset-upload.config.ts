import { StorageCore, StorageFolder } from '@app/domain/storage';
import { BadRequestException, Logger, UnauthorizedException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { createHash, randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage, StorageEngine } from 'multer';
import { extname } from 'path';
import sanitize from 'sanitize-filename';
import { AuthRequest, AuthUserDto } from '../decorators/auth-user.decorator';
import { patchFormData } from '../utils/path-form-data.util';

export interface ImmichFile extends Express.Multer.File {
  /** sha1 hash of file */
  checksum: Buffer;
}

export const assetUploadOption: MulterOptions = {
  fileFilter,
  storage: customStorage(),
};

const storageCore = new StorageCore();

export function customStorage(): StorageEngine {
  const storage = diskStorage({ destination, filename });

  return {
    _handleFile(req, file, callback) {
      const hash = createHash('sha1');
      file.stream.on('data', (chunk) => hash.update(chunk));

      storage._handleFile(req, file, (error, response) => {
        if (error) {
          hash.destroy();
          callback(error);
        } else {
          callback(null, { ...response, checksum: hash.digest() } as ImmichFile);
        }
      });
    },

    _removeFile(req, file, callback) {
      storage._removeFile(req, file, callback);
    },
  };
}

export const multerUtils = { fileFilter, filename, destination };

const logger = new Logger('AssetUploadConfig');

function fileFilter(req: AuthRequest, file: any, cb: any) {
  if (!req.user || (req.user.isPublicUser && !req.user.isAllowUpload)) {
    return cb(new UnauthorizedException());
  }
  if (
    file.mimetype.match(
      /\/(jpg|jpeg|png|gif|avi|mov|mp4|webm|x-msvideo|quicktime|heic|heif|dng|x-adobe-dng|webp|tiff|3gpp|nef|x-nikon-nef|x-fuji-raf|x-samsung-srw|mpeg|x-flv|x-ms-wmv|x-matroska|x-sony-arw|arw)$/,
    )
  ) {
    cb(null, true);
  } else {
    // Additionally support XML but only for sidecar files
    if (file.fieldname == 'sidecarData' && file.mimetype.match(/\/xml$/)) {
      return cb(null, true);
    }

    logger.error(`Unsupported file type ${extname(file.originalname)} file MIME type ${file.mimetype}`);
    cb(new BadRequestException(`Unsupported file type ${extname(file.originalname)}`), false);
  }
}

function destination(req: AuthRequest, file: Express.Multer.File, cb: any) {
  if (!req.user || (req.user.isPublicUser && !req.user.isAllowUpload)) {
    return cb(new UnauthorizedException());
  }

  const user = req.user as AuthUserDto;

  const uploadFolder = storageCore.getFolderLocation(StorageFolder.UPLOAD, user.id);
  if (!existsSync(uploadFolder)) {
    mkdirSync(uploadFolder, { recursive: true });
  }

  // Save original to disk
  cb(null, uploadFolder);
}

function filename(req: AuthRequest, file: Express.Multer.File, cb: any) {
  if (!req.user || (req.user.isPublicUser && !req.user.isAllowUpload)) {
    return cb(new UnauthorizedException());
  }

  file.originalname = patchFormData(file.originalname);

  const fileNameUUID = randomUUID();

  if (file.fieldname === 'livePhotoData') {
    const livePhotoFileName = `${fileNameUUID}.mov`;
    return cb(null, sanitize(livePhotoFileName));
  }

  if (file.fieldname === 'sidecarData') {
    const sidecarFileName = `${fileNameUUID}.xmp`;
    return cb(null, sanitize(sidecarFileName));
  }

  const fileName = `${fileNameUUID}${req.body['fileExtension']}`;
  return cb(null, sanitize(fileName));
}
