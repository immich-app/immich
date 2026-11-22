import { Body, Controller, HttpCode, HttpStatus, Next, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { type NextFunction, type Response } from 'express';
import { Endpoint, HistoryBuilder } from 'src/decorators.js';
import { StitchRequestDto } from 'src/dtos/stitch.dto.js';
import { type AuthDto } from 'src/dtos/auth.dto.js';
import { ApiTag, Permission } from 'src/enum.js';
import { Auth, Authenticated, FileResponse } from 'src/middleware/auth.guard.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { StitchService } from 'src/services/stitch.service.js';
import { sendFile } from 'src/utils/file.js';

@ApiTags(ApiTag.Assets)
@Controller('stitch')
export class StitchController {
  constructor(
    private logger: LoggingRepository,
    private service: StitchService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @FileResponse()
  @Authenticated({ permission: Permission.AssetDownload })
  @Endpoint({
    summary: 'Stitch images',
    description:
      'Stitch 2..50 image assets into one image. scroll = vertical scrolling screenshots, panorama = horizontal sweep. Returns a JPEG.',
    history: HistoryBuilder.v3(),
  })
  async stitch(
    @Auth() auth: AuthDto,
    @Body() dto: StitchRequestDto,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    await sendFile(res, next, () => this.service.stitch(auth, dto), this.logger);
  }
}
