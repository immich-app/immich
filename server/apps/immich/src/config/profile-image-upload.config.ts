import { StorageCore, StorageFolder } from '@app/domain/storage';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';
import sanitize from 'sanitize-filename';
import { AuthRequest, AuthUserDto } from '../decorators/auth-user.decorator';
import { patchFormData } from '../utils/path-form-data.util';

export const profileImageUploadOption: MulterOptions = {
  fileFilter,
  storage: diskStorage({
    destination,
    filename,
  }),
};

export const multerUtils = { fileFilter, filename, destination };

const storageCore = new StorageCore();

function fileFilter(req: AuthRequest, file: any, cb: any) {
  if (!req.user) {
    return cb(new UnauthorizedException());
  }

  if (file.mimetype.match(/\/(jpg|jpeg|png|heic|heif|dng|webp)$/)) {
    cb(null, true);
  } else {
    cb(new BadRequestException(`Unsupported file type ${extname(file.originalname)}`), false);
  }
}

function destination(req: AuthRequest, file: Express.Multer.File, cb: any) {
  if (!req.user) {
    return cb(new UnauthorizedException());
  }

  const user = req.user as AuthUserDto;

  const profileImageLocation = storageCore.getFolderLocation(StorageFolder.PROFILE, user.id);
  if (!existsSync(profileImageLocation)) {
    mkdirSync(profileImageLocation, { recursive: true });
  }

  cb(null, profileImageLocation);
}

function filename(req: AuthRequest, file: Express.Multer.File, cb: any) {
  if (!req.user) {
    return cb(new UnauthorizedException());
  }

  file.originalname = patchFormData(file.originalname);

  const userId = req.user.id;
  const fileName = `${userId}${extname(file.originalname)}`;

  cb(null, sanitize(String(fileName)));
}
