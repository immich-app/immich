import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { of } from 'rxjs';
import { AssetMediaResponseDto, AssetMediaStatus } from 'src/dtos/asset-media-response.dto.js';
import { ImmichHeader } from 'src/enum.js';
import { AuthenticatedRequest } from 'src/middleware/auth.guard.js';
import { AssetMediaService } from 'src/services/asset-media.service.js';
import { fromMaybeArray } from 'src/utils/request.js';

@Injectable()
export class AssetUploadInterceptor implements NestInterceptor {
  constructor(private service: AssetMediaService) {}

  async intercept(context: ExecutionContext, next: CallHandler<any>) {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const res = context.switchToHttp().getResponse<Response<AssetMediaResponseDto>>();

    const checksum = fromMaybeArray(req.headers[ImmichHeader.Checksum]);
    const response = await this.service.getUploadAssetIdByChecksum(req.user, checksum);
    if (response) {
      res.status(200);
      return of({ status: AssetMediaStatus.DUPLICATE, id: response.id });
    }

    return next.handle();
  }
}
