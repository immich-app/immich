import { Controller, Head, Param, Patch, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthDto } from 'src/dtos/auth.dto';
import { Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { AssetUploadService } from 'src/services/asset-upload.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Upload')
@Controller('upload')
export class AssetUploadController {
  constructor(private service: AssetUploadService) {}

  @Post('asset')
  @Authenticated({ sharedLink: true, permission: Permission.AssetUpload })
  handleInitialChunk(@Auth() auth: AuthDto, @Req() request: Request, @Res() response: Response): Promise<void> {
    return this.service.handleInitialChunk(auth, request, response);
  }

  @Patch('asset/:id')
  @Authenticated({ sharedLink: true, permission: Permission.AssetUpload })
  handleRemainingChunks(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    return this.service.handleRemainingChunks(auth, id, request, response);
  }

  @Head('asset/:id')
  @Authenticated({ sharedLink: true, permission: Permission.AssetUpload })
  getUploadStatus(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    return this.service.getUploadStatus(auth, id, request, response);
  }
}
