import {
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
import { ApiHeader, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import {
  GetUploadStatusDto,
  ResumeUploadDto,
  StartUploadDto,
  UploadHeader,
  UploadOkDto,
} from 'src/dtos/asset-upload.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { ImmichHeader, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { AssetUploadService } from 'src/services/asset-upload.service';
import { validateSyncOrReject } from 'src/utils/request';
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

// This is important to let go of the asset lock for an inactive request
const SOCKET_TIMEOUT_MS = 30_000;

@ApiTags('Upload')
@Controller('upload')
export class AssetUploadController {
  constructor(private service: AssetUploadService) {}

  @Post()
  @Authenticated({ sharedLink: true, permission: Permission.AssetUpload })
  @ApiHeader({
    name: ImmichHeader.AssetData,
    description: `RFC 9651 structured dictionary containing asset metadata with the following keys:
- device-asset-id (string, required): Unique device asset identifier
- device-id (string, required): Device identifier
- file-created-at (string/date, required): ISO 8601 date string or Unix timestamp
- file-modified-at (string/date, required): ISO 8601 date string or Unix timestamp
- filename (string, required): Original filename
- is-favorite (boolean, optional): Favorite status
- live-photo-video-id (string, optional): Live photo ID for assets from iOS devices
- icloud-id (string, optional): iCloud identifier for assets from iOS devices`,
    required: true,
    example:
      'device-asset-id="abc123", device-id="phone1", filename="photo.jpg", file-created-at="2024-01-01T00:00:00Z", file-modified-at="2024-01-01T00:00:00Z"',
  })
  @ApiHeader({
    name: UploadHeader.ReprDigest,
    description:
      'RFC 9651 structured dictionary containing an `sha` (bytesequence) checksum used to detect duplicate files and validate data integrity.',
    required: true,
  })
  @ApiHeader(apiInteropVersion)
  @ApiHeader(apiUploadComplete)
  @ApiHeader(apiContentLength)
  @ApiOkResponse({ type: UploadOkDto })
  startUpload(@Auth() auth: AuthDto, @Req() req: Request, @Res() res: Response): Promise<void> {
    res.setTimeout(SOCKET_TIMEOUT_MS);
    return this.service.startUpload(auth, req, res, validateSyncOrReject(StartUploadDto, req.headers));
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
  @ApiOkResponse({ type: UploadOkDto })
  resumeUpload(@Auth() auth: AuthDto, @Req() req: Request, @Res() res: Response, @Param() { id }: UUIDParamDto) {
    res.setTimeout(SOCKET_TIMEOUT_MS);
    return this.service.resumeUpload(auth, req, res, id, validateSyncOrReject(ResumeUploadDto, req.headers));
  }

  @Delete(':id')
  @Authenticated({ sharedLink: true, permission: Permission.AssetUpload })
  cancelUpload(@Auth() auth: AuthDto, @Res() res: Response, @Param() { id }: UUIDParamDto) {
    res.setTimeout(SOCKET_TIMEOUT_MS);
    return this.service.cancelUpload(auth, id, res);
  }

  @Head(':id')
  @Authenticated({ sharedLink: true, permission: Permission.AssetUpload })
  @ApiHeader(apiInteropVersion)
  getUploadStatus(@Auth() auth: AuthDto, @Req() req: Request, @Res() res: Response, @Param() { id }: UUIDParamDto) {
    res.setTimeout(SOCKET_TIMEOUT_MS);
    return this.service.getUploadStatus(auth, res, id, validateSyncOrReject(GetUploadStatusDto, req.headers));
  }

  @Options()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Header('Upload-Limit', 'min-size=0')
  getUploadOptions() {}
}
