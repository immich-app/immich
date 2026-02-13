import { Injectable } from '@nestjs/common';
import multer from 'multer';
import { of } from 'rxjs';
import { UploadFieldName } from 'src/dtos/asset-media.dto';
import { ImmichHeader } from 'src/enum';
import { UploadInterceptor } from 'src/middleware/upload.interceptor';
import { AssetMediaService } from 'src/services/asset-media.service';
import { fromMaybeArray } from 'src/utils/request';

@Injectable()
export class AssetUploadInterceptor extends UploadInterceptor {
  constructor(service: AssetMediaService) {
    super({
      onRequest: async (req, res) => {
        const checksum = fromMaybeArray(req.headers[ImmichHeader.Checksum]);
        const response = await service.onBeforeUpload(req.user, checksum);
        if (response) {
          res.status(200);
          return of(response);
        }
      },
      configure: (instance: multer.Multer) =>
        instance.fields([
          { name: UploadFieldName.ASSET_DATA, maxCount: 1 },
          { name: UploadFieldName.SIDECAR_DATA, maxCount: 1 },
        ]),
      canUpload: (req, file) => service.canUpload(req.user, file),
      upload: (req, file) => service.onUpload(req.user, file),
      remove: (req, file) => service.onUploadRemove(req.user, file),
    });
  }
}
