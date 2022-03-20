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
    if (file.mimetype.match(/\/(jpg|jpeg|png|gif|mp4|x-msvideo|quicktime|heic|heif|dng)$/)) {
      cb(null, true);
    } else {
      cb(new HttpException(`Unsupported file type ${extname(file.originalname)}`, HttpStatus.BAD_REQUEST), false);
    }
  },

  storage: diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: any) => {
      const uploadPath = multerConfig.dest;

      if (file.fieldname == 'assetData') {
        const originalUploadFolder = `${uploadPath}/${req.user['id']}/original/${req.body['deviceId']}`;

        if (!existsSync(originalUploadFolder)) {
          mkdirSync(originalUploadFolder, { recursive: true });
        }

        cb(null, originalUploadFolder);
      } else if (file.fieldname == 'thumbnailData') {
        const thumbnailUploadFolder = `${uploadPath}/${req.user['id']}/thumb/${req.body['deviceId']}`;

        if (!existsSync(thumbnailUploadFolder)) {
          mkdirSync(thumbnailUploadFolder, { recursive: true });
        }

        cb(null, thumbnailUploadFolder);
      }
    },

    filename: (req: Request, file: Express.Multer.File, cb: any) => {
      // console.log(req, file);

      if (file.fieldname == 'assetData') {
        cb(null, `${file.originalname.split('.')[0]}${req.body['fileExtension']}`);
      } else if (file.fieldname == 'thumbnailData') {
        cb(null, `${file.originalname.split('.')[0]}.jpeg`);
      }
    },
  }),
};
