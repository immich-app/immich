import { Controller, Delete, Head, Options, Param, Patch, Post, Req, Res } from '@nestjs/common';
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

  @Post()
  @Authenticated({ sharedLink: true, permission: Permission.AssetUpload })
  startUpload(@Auth() auth: AuthDto, @Req() request: Request, @Res() response: Response): Promise<void> {
    return this.service.startUpload(auth, request, response);
  }

  @Patch(':id')
  @Authenticated({ sharedLink: true, permission: Permission.AssetUpload })
  resumeUpload(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    return this.service.resumeUpload(auth, id, request, response);
  }

  @Delete(':id')
  @Authenticated({ sharedLink: true, permission: Permission.AssetUpload })
  cancelUpload(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto, @Res() response: Response): Promise<void> {
    return this.service.cancelUpload(auth, id, response);
  }

  @Head(':id')
  @Authenticated({ sharedLink: true, permission: Permission.AssetUpload })
  getUploadStatus(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto, @Res() response: Response): Promise<void> {
    return this.service.getUploadStatus(auth, id, response);
  }

  @Options()
  @Authenticated({ sharedLink: true, permission: Permission.AssetUpload })
  getUploadOptions(@Res() response: Response): Promise<void> {
    return this.service.getUploadOptions(response);
  }
}
