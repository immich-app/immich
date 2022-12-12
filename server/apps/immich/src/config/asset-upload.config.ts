import { APP_UPLOAD_LOCATION } from '@app/common/constants';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import sanitize from 'sanitize-filename';

export const assetUploadOption: MulterOptions = {
  fileFilter,
  storage: diskStorage({
    destination,
    filename,
  }),
};

export const multerUtils = { fileFilter, filename, destination };

function fileFilter(req: Request, file: any, cb: any) {
  if (!req.user) {
    return cb(new UnauthorizedException());
  }
  if (
    file.mimetype.match(
      /\/(jpg|jpeg|png|gif|mp4|x-msvideo|quicktime|heic|heif|dng|x-adobe-dng|webp|tiff|3gpp|nef|x-nikon-nef)$/,
    )
  ) {
    cb(null, true);
  } else {
    cb(new BadRequestException(`Unsupported file type ${extname(file.originalname)}`), false);
  }
}

function destination(req: Request, file: Express.Multer.File, cb: any) {
  if (!req.user) {
    return cb(new UnauthorizedException());
  }

  const basePath = APP_UPLOAD_LOCATION;
  const destination = join(basePath, req.user.id, 'consume');

  if (!existsSync(destination)) {
    mkdirSync(destination, { recursive: true });
  }

  // Save original to disk
  cb(null, destination);
}

function filename(req: Request, file: Express.Multer.File, cb: any) {
  if (!req.user) {
    return cb(new UnauthorizedException());
  }

  const fileNameUUID = randomUUID();

  if (file.fieldname === 'livePhotoData') {
    const livePhotoFileName = `${fileNameUUID}.mov`;
    return cb(null, sanitize(livePhotoFileName));
  }

  const fileName = `${fileNameUUID}${req.body['fileExtension'].toLowerCase()}`;
  return cb(null, sanitize(fileName));
}
