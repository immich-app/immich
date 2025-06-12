import { Controller, Get, Header, Param, Query, Res, UnauthorizedException } from '@nestjs/common';
import {FileResponse} from 'src/middleware/auth.guard';
import {PartParamDto, PlaylistParamDto} from 'src/dtos/video.dto';
import {Response} from 'express';
import {TranscodingService} from 'src/services/transcofing.service';
import {LoggingRepository} from 'src/repositories/logging.repository';
import {RouteKey} from 'src/enum';
import {ApiTags} from '@nestjs/swagger';
import {JsonWebTokenError, JwtPayload, verify} from 'jsonwebtoken';
import {SystemMetadataRepository} from 'src/repositories/system-metadata.repository';
import {promisify} from 'node:util';
import sanitize from 'sanitize-filename';
import fs from 'node:fs';

type SendFile = Parameters<Response['sendFile']>;
type SendFileOptions = SendFile[1];

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
  ) {
    let data;
    try {
      data = verify(secret, await this.systemMetadataRepository.getSecretKey()) as JwtPayload | { id: string };
    } catch (error: any) {
      throw (error instanceof JsonWebTokenError ? new UnauthorizedException() : error);
    }

    const arr = name.split('.');
    const _sendFile = (path: string, options: SendFileOptions) =>
      promisify<string, SendFileOptions>(res.sendFile).bind(res)(path, options);

    res.set('Cache-Control', 'private, max-age=86400, no-transform');
    res.header('Content-Type', 'video/mp4');
    if (arr.length == 1) {
      await _sendFile(`/tmp/video/${sanitize(data['id'])}/${sanitize(arr[0])}.mp4`, { root: '/' });
      return;
    }
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
