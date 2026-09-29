import {
  Controller,
  Delete,
  Get,
  Header,
  Headers,
  HttpCode,
  HttpStatus,
  Next,
  Options,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiProduces, ApiTags } from '@nestjs/swagger';
import { ZodValidationException } from 'nestjs-zod';
import type { NextFunction, Request, Response } from 'express';
import type { AuthDto } from 'src/dtos/auth.dto.js';
import { HLS_PLAYLIST_CONTENT_TYPE } from 'src/constants.js';
import { Endpoint, HistoryBuilder } from 'src/decorators.js';
import {
  HlsPlaylistHeaderDto,
  HlsSegmentHeaderDto,
  HlsSegmentParamDto,
  HlsSessionParamDto,
  HlsVariantParamDto,
} from 'src/dtos/streaming.dto.js';
import { ApiTag, ImmichHeader, Permission, RouteKey } from 'src/enum.js';
import { Auth, Authenticated, FileResponse } from 'src/middleware/auth.guard.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { HlsService } from 'src/services/hls.service.js';
import { allowCrossOriginCastMedia } from 'src/utils/cast.js';
import { sendFile } from 'src/utils/file.js';
import { UUIDParamDto } from 'src/validation.js';

@ApiTags(ApiTag.Assets)
@Controller(RouteKey.Asset)
export class VideoStreamController {
  constructor(
    private logger: LoggingRepository,
    private service: HlsService,
  ) {}

  @Get(':id/video/stream/main.m3u8')
  @Authenticated({ permission: Permission.AssetView, sharedLink: true })
  @Header('Cache-Control', 'no-cache')
  @Header('Content-Type', HLS_PLAYLIST_CONTENT_TYPE)
  @ApiProduces(HLS_PLAYLIST_CONTENT_TYPE)
  @Endpoint({
    summary: 'Get HLS main playlist',
    description: 'Returns an HLS main playlist with all available variants for the asset.',
    history: new HistoryBuilder().added('v3').alpha('v3'),
  })
  getMainPlaylist(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    allowCrossOriginCastMedia(req, res);
    return this.service.getMainPlaylist(auth, id);
  }

  @Get(':id/video/stream/:sessionId/:variantIndex/playlist.m3u8')
  @Authenticated({ permission: Permission.AssetView, sharedLink: true })
  @Header('Cache-Control', 'no-cache')
  @Header('Content-Type', HLS_PLAYLIST_CONTENT_TYPE)
  @ApiProduces(HLS_PLAYLIST_CONTENT_TYPE)
  @Endpoint({
    summary: 'Get HLS media playlist',
    description: 'Returns an HLS media playlist for one variant of the streaming session.',
    history: new HistoryBuilder().added('v3').alpha('v3'),
  })
  getMediaPlaylist(
    @Auth() auth: AuthDto,
    @Param() { id, sessionId, variantIndex }: HlsVariantParamDto,
    @Headers() headers: HlsPlaylistHeaderDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    allowCrossOriginCastMedia(req, res);
    try {
      headers = HlsPlaylistHeaderDto.create(headers);
    } catch (error) {
      throw new ZodValidationException(error);
    }
    return this.service.getMediaPlaylist(auth, id, sessionId, variantIndex, headers[ImmichHeader.HlsPosition]);
  }

  @Get(':id/video/stream/:sessionId/:variantIndex/:filename')
  @FileResponse()
  @Authenticated({ permission: Permission.AssetView, sharedLink: true })
  @Endpoint({
    summary: 'Get HLS segment or init file',
    description: 'Streams an HLS init segment (init.mp4) or media segment (seg_N.m4s).',
    history: new HistoryBuilder().added('v3').alpha('v3'),
  })
  async getSegment(
    @Auth() auth: AuthDto,
    @Param() { id, sessionId, variantIndex, filename }: HlsSegmentParamDto,
    @Headers() headers: HlsSegmentHeaderDto,
    @Res() res: Response,
    @Next() next: NextFunction,
    @Req() req: Request,
  ) {
    allowCrossOriginCastMedia(req, res);
    try {
      headers = HlsSegmentHeaderDto.create(headers);
    } catch (error) {
      throw new ZodValidationException(error);
    }
    await sendFile(
      res,
      next,
      () => this.service.getSegment(auth, id, sessionId, variantIndex, filename, headers[ImmichHeader.HlsInitSegment]),
      this.logger,
    );
  }

  @Delete(':id/video/stream/:sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated({ permission: Permission.AssetView, sharedLink: true })
  @Endpoint({
    summary: 'End HLS streaming session',
    description: 'Releases server resources for the streaming session.',
    history: new HistoryBuilder().added('v3').alpha('v3'),
  })
  async endSession(
    @Auth() auth: AuthDto,
    @Param() { id, sessionId }: HlsSessionParamDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    allowCrossOriginCastMedia(req, res);
    await this.service.endSession(auth, id, sessionId);
  }

  // DELETE cleanup and Range requests can trigger a cross-origin preflight.
  @Options(':id/video/stream/{*path}')
  @Authenticated({ public: true })
  @ApiExcludeEndpoint()
  @HttpCode(HttpStatus.NO_CONTENT)
  preflight(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    allowCrossOriginCastMedia(req, res);
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Range');
  }
}
