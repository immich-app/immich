import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { APP_UPLOAD_LOCATION } from '../constants/upload_location.constant';

export const assetUploadOption: MulterOptions = {
  fileFilter: (req: Request, file: any, cb: any) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|gif|mp4|x-msvideo|quicktime|heic|heif|dng|webp)$/)) {
      cb(null, true);
    } else {
      cb(new HttpException(`Unsupported file type ${extname(file.originalname)}`, HttpStatus.BAD_REQUEST), false);
    }
  },

  storage: diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: any) => {
      const basePath = APP_UPLOAD_LOCATION;
      // TODO these are currently not used. Shall we remove them?
      // const fileInfo = req.body as CreateAssetDto;

      // const yearInfo = new Date(fileInfo.createdAt).getFullYear();
      // const monthInfo = new Date(fileInfo.createdAt).getMonth();

      if (!req.user) {
        return;
      }

      const originalUploadFolder = `${basePath}/${req.user.id}/original/${req.body['deviceId']}`;

      if (!existsSync(originalUploadFolder)) {
        mkdirSync(originalUploadFolder, { recursive: true });
      }

      // Save original to disk
      cb(null, originalUploadFolder);
    },

    filename: (req: Request, file: Express.Multer.File, cb: any) => {
      const fileNameUUID = randomUUID();

      cb(null, `${fileNameUUID}${req.body['fileExtension'].toLowerCase()}`);
    },
  }),
};

export const asyncAssetUploadOptions = async (config: ConfigService): Promise<MulterOptions> => {
  const uploadOptions: MulterOptions = {
    fileFilter: (req: Request, file: any, cb: any) => {
      if (file.mimetype.match(/\/(jpg|jpeg|png|gif|mp4|x-msvideo|quicktime|heic|heif|dng|webp)$/)) {
        cb(null, true);
      } else {
        cb(new HttpException(`Unsupported file type ${extname(file.originalname)}`, HttpStatus.BAD_REQUEST), false);
      }
    },

    storage: diskStorage({
      destination: (req: Request, file: Express.Multer.File, cb: any) => {
        const basePath = config.get<string>('UPLOAD_LOCATION');
        // TODO these are currently not used. Shall we remove them?
        // const fileInfo = req.body as CreateAssetDto;
  
        // const yearInfo = new Date(fileInfo.createdAt).getFullYear();
        // const monthInfo = new Date(fileInfo.createdAt).getMonth();
  
        if (!req.user) {
          return;
        }
  
        const originalUploadFolder = `${basePath}/${req.user.id}/original/${req.body['deviceId']}`;
  
        if (!existsSync(originalUploadFolder)) {
          mkdirSync(originalUploadFolder, { recursive: true });
        }
  
        // Save original to disk
        cb(null, originalUploadFolder);
      },
  
      filename: (req: Request, file: Express.Multer.File, cb: any) => {
        const fileNameUUID = randomUUID();
  
        cb(null, `${fileNameUUID}${req.body['fileExtension'].toLowerCase()}`);
      },
    }),
  };

  return uploadOptions;
};