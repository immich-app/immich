import { HttpException, HttpStatus } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';
import { APP_UPLOAD_LOCATION } from '../constants/upload_location.constant';
import { randomUUID } from 'crypto';
import { CreateAssetDto } from '../api-v1/asset/dto/create-asset.dto';

export const multerOption: MulterOptions = {
  fileFilter: (req: Request, file: any, cb: any) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|gif|mp4|x-msvideo|quicktime|heic|heif|dng|webp)$/)) {
      cb(null, true);
    } else {
      cb(new HttpException(`Unsupported file type ${extname(file.originalname)}`, HttpStatus.BAD_REQUEST), false);
    }
  },

  storage: diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: any) => {
      const uploadPath = APP_UPLOAD_LOCATION;
      const fileInfo = req.body as CreateAssetDto;

      const yearInfo = new Date(fileInfo.createdAt).getFullYear();
      const monthInfo = new Date(fileInfo.createdAt).getMonth();

      if (file.fieldname == 'assetData') {
        const originalUploadFolder = `${uploadPath}/${req.user['id']}/original/${req.body['deviceId']}`;

        if (!existsSync(originalUploadFolder)) {
          mkdirSync(originalUploadFolder, { recursive: true });
        }

        // Save original to disk
        cb(null, originalUploadFolder);
      } else if (file.fieldname == 'thumbnailData') {
        const thumbnailUploadFolder = `${uploadPath}/${req.user['id']}/thumb/${req.body['deviceId']}`;

        if (!existsSync(thumbnailUploadFolder)) {
          mkdirSync(thumbnailUploadFolder, { recursive: true });
        }

        // Save thumbnail to disk
        cb(null, thumbnailUploadFolder);
      }
    },

    filename: (req: Request, file: Express.Multer.File, cb: any) => {
      // console.log(req, file);
      const fileNameUUID = randomUUID();
      if (file.fieldname == 'assetData') {
        cb(null, `${fileNameUUID}${req.body['fileExtension'].toLowerCase()}`);
      } else if (file.fieldname == 'thumbnailData') {
        cb(null, `${fileNameUUID}.jpeg`);
      }
    },
  }),
};
