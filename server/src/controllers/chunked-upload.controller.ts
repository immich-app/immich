import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import {
  ChunkedUploadSessionResponseDto,
  CreateChunkedUploadSessionDto,
  FinishChunkedUploadResponseDto,
  UploadChunkResponseDto,
} from 'src/dtos/asset-media-chunked.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { ChunkedUploadService } from 'src/services/chunked-upload.service';
import { UUIDParamDto } from 'src/validation';

class SessionIdParamDto {
  sessionId!: string;
}

@ApiTags(ApiTag.Assets)
@Controller('assets/chunked-upload')
export class ChunkedUploadController {
  constructor(private service: ChunkedUploadService) {}

  @Post()
  @Authenticated({ permission: Permission.AssetUpload })
  @ApiResponse({
    status: 201,
    description: 'Chunked upload session created',
    type: ChunkedUploadSessionResponseDto,
  })
  @Endpoint({
    summary: 'Create chunked upload session',
    description:
      'Creates a new chunked upload session for uploading large files in parts. ' +
      'This is designed to work with reverse proxies that have body size limits ' +
      '(e.g. Cloudflare 100MB limit). The file is split into chunks that are ' +
      'uploaded individually and assembled on the server.',
    history: new HistoryBuilder().added('v1'),
  })
  createSession(
    @Auth() auth: AuthDto,
    @Body() dto: CreateChunkedUploadSessionDto,
  ): Promise<ChunkedUploadSessionResponseDto> {
    return this.service.createSession(auth, dto);
  }

  @Post(':sessionId/chunks/:chunkIndex')
  @Authenticated({ permission: Permission.AssetUpload })
  @ApiConsumes('application/octet-stream')
  @ApiBody({
    description: 'Raw chunk binary data',
    type: 'string',
    schema: { type: 'string', format: 'binary' },
  })
  @ApiResponse({
    status: 201,
    description: 'Chunk uploaded successfully',
    type: UploadChunkResponseDto,
  })
  @Endpoint({
    summary: 'Upload a chunk',
    description:
      'Uploads a single chunk of binary data for the specified upload session. ' +
      'Each chunk should be sent as raw binary (application/octet-stream). ' +
      'Chunk size must match the session configuration (last chunk can be smaller).',
    history: new HistoryBuilder().added('v1'),
  })
  async uploadChunk(
    @Auth() auth: AuthDto,
    @Param('sessionId') sessionId: string,
    @Param('chunkIndex') chunkIndex: string,
    @Req() req: RawBodyRequest<Request>,
  ): Promise<UploadChunkResponseDto> {
    // Read the raw body as a buffer
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk as Buffer);
    }
    const chunkData = Buffer.concat(chunks);

    return this.service.uploadChunk(auth, sessionId, Number.parseInt(chunkIndex, 10), chunkData);
  }

  @Post(':sessionId/finish')
  @Authenticated({ permission: Permission.AssetUpload })
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'Chunked upload completed and asset created',
    type: FinishChunkedUploadResponseDto,
  })
  @Endpoint({
    summary: 'Finish chunked upload',
    description:
      'Assembles all uploaded chunks into the final file, computes the checksum, ' +
      'and creates the asset. All chunks must be uploaded before calling this endpoint.',
    history: new HistoryBuilder().added('v1'),
  })
  finishUpload(
    @Auth() auth: AuthDto,
    @Param('sessionId') sessionId: string,
  ): Promise<FinishChunkedUploadResponseDto> {
    return this.service.finishUpload(auth, sessionId);
  }

  @Get(':sessionId/status')
  @Authenticated({ permission: Permission.AssetUpload })
  @ApiResponse({
    status: 200,
    description: 'Upload session status including received chunks',
  })
  @Endpoint({
    summary: 'Get upload session status',
    description:
      'Returns the current status of a chunked upload session, including which chunks ' +
      'have been received. Useful for implementing upload resume functionality.',
    history: new HistoryBuilder().added('v1'),
  })
  getSessionStatus(
    @Auth() auth: AuthDto,
    @Param('sessionId') sessionId: string,
  ) {
    return this.service.getSessionStatus(auth, sessionId);
  }

  @Delete(':sessionId')
  @Authenticated({ permission: Permission.AssetUpload })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: 204,
    description: 'Upload session cancelled and temp files cleaned up',
  })
  @Endpoint({
    summary: 'Cancel chunked upload session',
    description: 'Cancels an upload session and cleans up any temporary chunk files.',
    history: new HistoryBuilder().added('v1'),
  })
  cancelSession(
    @Auth() auth: AuthDto,
    @Param('sessionId') sessionId: string,
  ): Promise<void> {
    return this.service.cancelSession(auth, sessionId);
  }
}
