import { Controller, Get, Param, Post, Res, StreamableFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  ImporterConfigResponseDto,
  ImporterPlatform,
  SetupTokenResponseDto,
} from 'src/dtos/importer.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { ImporterService } from 'src/services/importer.service';

@ApiTags(ApiTag.Importer)
@Controller('importer')
export class ImporterController {
  constructor(private service: ImporterService) {}

  @Post('setup-token')
  @Authenticated({ permission: Permission.AssetUpload })
  @Endpoint({
    summary: 'Create a setup token for the Google Photos Importer app',
    description:
      'Creates a temporary API key and setup token that can be used to configure the desktop importer app. The token is valid for 30 days.',
    history: new HistoryBuilder().added('v1'),
  })
  createSetupToken(@Auth() auth: AuthDto): Promise<SetupTokenResponseDto> {
    return this.service.createSetupToken(auth);
  }

  @Get('config/:token')
  @Endpoint({
    summary: 'Get importer configuration',
    description:
      'Returns the server URL, API key, and OAuth credentials for the desktop importer app. This endpoint is called by the desktop app after receiving the setup token.',
    history: new HistoryBuilder().added('v1'),
  })
  getConfig(@Param('token') token: string): Promise<ImporterConfigResponseDto> {
    return this.service.getImporterConfig(token);
  }

  @Get('bootstrap/:token/:platform')
  @Endpoint({
    summary: 'Download bootstrap binary',
    description:
      'Downloads a personalized bootstrap binary for the specified platform. The binary has the server URL and setup token embedded.',
    history: new HistoryBuilder().added('v1'),
  })
  async getBootstrap(
    @Param('token') token: string,
    @Param('platform') platform: ImporterPlatform,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const binary = await this.service.buildBootstrap(token, platform);

    const filename =
      platform === ImporterPlatform.WINDOWS_AMD64
        ? 'immich-importer-setup.exe'
        : 'immich-importer-setup';

    const contentType =
      platform === ImporterPlatform.WINDOWS_AMD64
        ? 'application/vnd.microsoft.portable-executable'
        : 'application/octet-stream';

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': binary.length,
    });

    return new StreamableFile(binary);
  }
}
