import { HttpException, HttpStatus } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';
import { APP_UPLOAD_LOCATION } from '../constants/upload_location.constant';

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
      const basePath = APP_UPLOAD_LOCATION;
      const profileImageLocation = `${basePath}/${req.user['id']}/profile`;
      if (!existsSync(profileImageLocation)) {
        mkdirSync(profileImageLocation, { recursive: true });
      }


      cb(null, profileImageLocation);
    },

    filename: (req: Request, file: Express.Multer.File, cb: any) => {
      const userId = req.user['id'];

      cb(null, `${userId}`);
    },
  }),
};


