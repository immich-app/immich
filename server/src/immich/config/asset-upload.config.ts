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

const validMimeTypes = [
  'image/avif',
  'image/dng',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/jpeg',
  'image/jxl',
  'image/png',
  'image/tiff',
  'image/webp',
  'image/x-adobe-dng',
  'image/x-arriflex-ari',
  'image/x-canon-cr2',
  'image/x-canon-cr3',
  'image/x-canon-crw',
  'image/x-epson-erf',
  'image/x-fuji-raf',
  'image/x-hasselblad-3fr',
  'image/x-hasselblad-fff',
  'image/x-kodak-dcr',
  'image/x-kodak-k25',
  'image/x-kodak-kdc',
  'image/x-leica-rwl',
  'image/x-minolta-mrw',
  'image/x-nikon-nef',
  'image/x-olympus-orf',
  'image/x-olympus-ori',
  'image/x-panasonic-raw',
  'image/x-pentax-pef',
  'image/x-phantom-cin',
  'image/x-phaseone-cap',
  'image/x-phaseone-iiq',
  'image/x-samsung-srw',
  'image/x-sigma-x3f',
  'image/x-sony-arw',
  'image/x-sony-sr2',
  'image/x-sony-srf',
  'video/3gpp',
  'video/avi',
  'video/mov',
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/webm',
  'video/x-flv',
  'video/x-matroska',
  'video/x-ms-wmv',
  'video/x-msvideo',
];

function fileFilter(req: AuthRequest, file: any, cb: any) {
  if (!req.user || (req.user.isPublicUser && !req.user.isAllowUpload)) {
    return cb(new UnauthorizedException());
  }

  if (validMimeTypes.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  // Additionally support XML but only for sidecar files.
  if (file.fieldname === 'sidecarData' && ['application/xml', 'text/xml'].includes(file.mimetype)) {
    return cb(null, true);
  }

  logger.error(`Unsupported file type ${extname(file.originalname)} file MIME type ${file.mimetype}`);
  cb(new BadRequestException(`Unsupported file type ${extname(file.originalname)}`), false);
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
