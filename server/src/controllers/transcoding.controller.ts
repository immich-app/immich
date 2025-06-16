import { Controller, Get, Header, Next, Param, Query, Res, UnauthorizedException } from '@nestjs/common';
import {FileResponse} from 'src/middleware/auth.guard';
import {PartParamDto, PlaylistParamDto} from 'src/dtos/video.dto';
import { NextFunction, Response } from 'express';
import {TranscodingService} from 'src/services/transcofing.service';
import {LoggingRepository} from 'src/repositories/logging.repository';
import {CacheControl, RouteKey} from 'src/enum';
import {ApiTags} from '@nestjs/swagger';
import {JsonWebTokenError, JwtPayload, verify} from 'jsonwebtoken';
import {SystemMetadataRepository} from 'src/repositories/system-metadata.repository';
import sanitize from 'sanitize-filename';
import fs from 'node:fs';
import {sendFile} from 'src/utils/file';

@ApiTags('Transcoder')
@Controller(RouteKey.PLAYBACK)
export class TranscodingController {
  constructor(
    private service: TranscodingService,
    private logger: LoggingRepository,
    private systemMetadataRepository: SystemMetadataRepository,
  ) {}

  @Get(':secret/:name.m3u8')
  @Header('Content-Type', 'application/vnd.apple.mpegurl')
  @FileResponse()
  async getPlaylist(
    @Param() { secret, name }: PlaylistParamDto,
    @Query('start') start?: number,
  ) {
    let data;
    try {
      data = verify(secret, await this.systemMetadataRepository.getSecretKey()) as JwtPayload | { id: string };
    } catch (error: any) {
      throw (error instanceof JsonWebTokenError ? new UnauthorizedException() : error);
    }
    if (name == 'master.m3u8') {
      return await this.service.getMasterPlaylist(data.id);
    }

    return await this.service.getPlaylist(data.id, sanitize(name), start !== 0)
  }

  @Get(':secret/:quality/:name.mp4')
  @FileResponse()
  async getVideoPart(
    @Param() { secret, name }: PartParamDto,
    @Res() res: Response,
    @Next() next: NextFunction
  ) {
    let data;
    try {
      data = verify(secret, await this.systemMetadataRepository.getSecretKey()) as JwtPayload | { id: string };
    } catch (error: any) {
      throw (error instanceof JsonWebTokenError ? new UnauthorizedException() : error);
    }

    const arr = name.split('.');

    if (arr.length == 1) {
      // It's necessary to provide promisified result into sendFile
      // eslint-disable-next-line @typescript-eslint/require-await
      await sendFile(res, next, async () => {
        return {
          path: `/tmp/video/${sanitize(data['id'])}/${sanitize(arr[0])}.mp4`,
          cacheControl: CacheControl.PRIVATE_WITH_CACHE,
          contentType: 'video/mp4'
        };
      }, this.logger);
      return;
    }
    
    // Make full segment by joining parts
    for (const name of arr) {
      await new Promise<void>((resolve) => {
        const buf = fs.createReadStream(`/tmp/video/${sanitize(data['id'])}/${sanitize(name)}.mp4`);
        buf.pipe(res, { end: false });
        buf.on('end', () => {
          resolve();
        });
      });
    }
    res.end();
  }
}
