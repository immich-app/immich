import { Injectable } from '@nestjs/common';
import multer from 'multer';
import { UploadFieldName } from 'src/dtos/asset-media.dto';
import { UploadInterceptor } from 'src/middleware/upload.interceptor';
import { UserService } from 'src/services/user.service';

@Injectable()
export class UserProfileUploadInterceptor extends UploadInterceptor {
  constructor(service: UserService) {
    super({
      configure: (instance: multer.Multer) => instance.single(UploadFieldName.PROFILE_DATA),
      canUpload: (req, file) => service.canUpload(req.user, file),
      upload: (req, file) => service.onUpload(req.user, file),
      remove: (req, file) => service.onUploadRemove(req.user, file),
    });
  }
}
