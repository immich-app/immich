import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { of } from 'rxjs';
import { AssetMediaResponseDto, AssetMediaStatus } from 'src/dtos/asset-media-response.dto';
import { ImmichHeader } from 'src/enum';
import { AuthenticatedRequest } from 'src/middleware/auth.guard';
import { AssetMediaService } from 'src/services/asset-media.service';
import { fromMaybeArray, getReqRes } from 'src/utils/request';

@Injectable()
export class AssetUploadInterceptor implements NestInterceptor {
  constructor(private service: AssetMediaService) {}

  async intercept(context: ExecutionContext, next: CallHandler<any>) {
    const { type, req, res } = getReqRes<AuthenticatedRequest, Response<AssetMediaResponseDto>>(context);

    const checksum = fromMaybeArray(req.headers[ImmichHeader.CHECKSUM]);
    const response = await this.service.getUploadAssetIdByChecksum(req.user, checksum);
    if (response && type === 'http') {
      res.status(200);
      return of({ status: AssetMediaStatus.DUPLICATE, id: response.id });
    }

    return next.handle();
  }
}
