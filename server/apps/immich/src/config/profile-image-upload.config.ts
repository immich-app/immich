import { APP_UPLOAD_LOCATION } from '@app/common/constants';
import { HttpException, HttpStatus } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';
import sanitize from 'sanitize-filename';

export const profileImageUploadOption: MulterOptions = {
  fileFilter: (req: Request, file: any, cb: any) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|heic|heif|dng|webp)$/)) {
      cb(null, true);
    } else {
      cb(new HttpException(`Unsupported file type ${extname(file.originalname)}`, HttpStatus.BAD_REQUEST), false);
    }
  },

  storage: diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: any) => {
      if (!req.user) {
        return;
      }
      const basePath = APP_UPLOAD_LOCATION;
      const profileImageLocation = `${basePath}/${req.user.id}/profile`;

      if (!existsSync(profileImageLocation)) {
        mkdirSync(profileImageLocation, { recursive: true });
      }

      cb(null, profileImageLocation);
    },

    filename: (req: Request, file: Express.Multer.File, cb: any) => {
      if (!req.user) {
        return;
      }
      const userId = req.user.id;
      const fileName = `${userId}${extname(file.originalname)}`;

      cb(null, sanitize(fileName));
    },
  }),
};
