import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { AssetMediaResponseDto } from 'src/dtos/asset-media-response.dto';
import { ImmichHeader } from 'src/dtos/auth.dto';
import { AuthenticatedRequest } from 'src/middleware/auth.guard';
import { AssetMediaService } from 'src/services/asset-media.service';
import { fromMaybeArray } from 'src/utils/request';

@Injectable()
export class AssetUploadInterceptor implements NestInterceptor {
  constructor(private service: AssetMediaService) {}

  async intercept(context: ExecutionContext, next: CallHandler<any>) {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const res = context.switchToHttp().getResponse<Response<AssetMediaResponseDto>>();

    const checksum = fromMaybeArray(req.headers[ImmichHeader.CHECKSUM]);
    const response = await this.service.getUploadAssetIdByChecksum(req.user, checksum);
    if (response) {
      res.status(200).send(response);
    }

    return next.handle();
  }
}
