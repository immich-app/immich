import {
  BadRequestException,
  Controller,
  Delete,
  Head,
  Header,
  HttpCode,
  HttpStatus,
  Options,
  Param,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Response } from 'express';
import { IncomingHttpHeaders } from 'node:http';
import { AuthDto } from 'src/dtos/auth.dto';
import { GetUploadStatusDto, ResumeUploadDto, StartUploadDto, UploadHeader } from 'src/dtos/upload.dto';
import { ImmichHeader, Permission } from 'src/enum';
import { Auth, Authenticated, AuthenticatedRequest } from 'src/middleware/auth.guard';
import { AssetUploadService } from 'src/services/asset-upload.service';
import { UUIDParamDto } from 'src/validation';

const apiInteropVersion = {
  name: UploadHeader.InteropVersion,
  description: `Indicates the version of the RUFH protocol supported by the client.`,
  required: true,
};

const apiUploadComplete = {
  name: UploadHeader.UploadComplete,
  description:
    'Structured boolean indicating whether this request completes the file. Use Upload-Incomplete instead for version <= 3.',
  required: true,
};

const apiContentLength = {
  name: UploadHeader.ContentLength,
  description: 'Non-negative size of the request body in bytes.',
  required: true,
};

@ApiTags('Upload')
@Controller('upload')
export class AssetUploadController {
  constructor(private service: AssetUploadService) {}

  @Post()
  @Authenticated({ sharedLink: true, permission: Permission.AssetUpload })
  @ApiHeader({
    name: ImmichHeader.AssetData,
    description:
      'Base64-encoded JSON of asset metadata. The expected content is the same as AssetMediaCreateDto, except that `filename` is required and `sidecarData` is ignored.',
    required: true,
  })
  @ApiHeader({
    name: UploadHeader.ReprDigest,
    description:
      'Structured dictionary containing an SHA-1 checksum used to detect duplicate files and validate data integrity.',
    required: true,
  })
  @ApiHeader(apiInteropVersion)
  @ApiHeader(apiUploadComplete)
  @ApiHeader(apiContentLength)
  startUpload(@Req() req: AuthenticatedRequest, @Res() res: Response): Promise<void> {
    const dto = this.getDto(StartUploadDto, req.headers);
    console.log('Starting upload with dto:', JSON.stringify(dto));
    return this.service.startUpload(req, res, dto);
  }

  @Patch(':id')
  @Authenticated({ sharedLink: true, permission: Permission.AssetUpload })
  @ApiHeader({
    name: UploadHeader.UploadOffset,
    description:
      'Non-negative byte offset indicating the starting position of the data in the request body within the entire file.',
    required: true,
  })
  @ApiHeader(apiInteropVersion)
  @ApiHeader(apiUploadComplete)
  @ApiHeader(apiContentLength)
  resumeUpload(@Req() req: AuthenticatedRequest, @Res() res: Response, @Param() { id }: UUIDParamDto) {
    const dto = this.getDto(ResumeUploadDto, req.headers);
    console.log('Resuming upload with dto:', JSON.stringify(dto));
    return this.service.resumeUpload(req, res, id, dto);
  }

  @Delete(':id')
  @Authenticated({ sharedLink: true, permission: Permission.AssetUpload })
  cancelUpload(@Auth() auth: AuthDto, @Res() res: Response, @Param() { id }: UUIDParamDto) {
    return this.service.cancelUpload(auth, id, res);
  }

  @Head(':id')
  @Authenticated({ sharedLink: true, permission: Permission.AssetUpload })
  @ApiHeader(apiInteropVersion)
  getUploadStatus(@Req() req: AuthenticatedRequest, @Res() res: Response, @Param() { id }: UUIDParamDto) {
    const dto = this.getDto(GetUploadStatusDto, req.headers);
    console.log('Getting upload status with dto:', JSON.stringify(dto));
    return this.service.getUploadStatus(req.auth, res, id, dto);
  }

  @Options()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Header('Upload-Limit', 'min-size=0')
  getUploadOptions() {}

  private getDto<T extends object>(cls: new () => T, headers: IncomingHttpHeaders): T {
    const dto = plainToInstance(cls, headers, { excludeExtraneousValues: true });
    const errors = validateSync(dto);
    if (errors.length > 0) {
      const constraints = errors.flatMap((e) => (e.constraints ? Object.values(e.constraints) : []));
      console.warn('Upload DTO validation failed:', JSON.stringify(errors, null, 2));
      throw new BadRequestException(constraints);
    }
    return dto;
  }
}
