import { HttpException, HttpStatus } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';
import { APP_UPLOAD_LOCATION } from '../constants/upload_location.constant';

export const multerConfig = {
  dest: APP_UPLOAD_LOCATION,
};

export const multerOption: MulterOptions = {
  fileFilter: (req: Request, file: any, cb: any) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|gif|mp4|x-msvideo|quicktime|heic|heif)$/)) {
      cb(null, true);
    } else {
      cb(new HttpException(`Unsupported file type ${extname(file.originalname)}`, HttpStatus.BAD_REQUEST), false);
    }
  },

  storage: diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: any) => {
      const uploadPath = multerConfig.dest;

      const userPath = `${uploadPath}/${req.user['id']}/original/${req.body['deviceId']}`;

      if (!existsSync(userPath)) {
        mkdirSync(userPath, { recursive: true });
      }

      cb(null, userPath);
    },

    filename: (req: Request, file: Express.Multer.File, cb: any) => {
      cb(null, `${file.originalname}${req.body['fileExtension']}`);
    },
  }),
};
