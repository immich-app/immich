import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthDto } from 'src/dtos/auth.dto.js';
import { Endpoint, HistoryBuilder } from 'src/decorators.js';
import { MemoryDockStyleTransformDto } from 'src/dtos/memorydock.dto.js';
import { ApiTag, Permission } from 'src/enum.js';
import { Auth, Authenticated } from 'src/middleware/auth.guard.js';
import { MemoryDockService } from 'src/services/memorydock.service.js';

@ApiTags(ApiTag.Assets)
@Controller('memorydock')
export class MemoryDockController {
  constructor(private service: MemoryDockService) {}

  @Post('style-transforms')
  @HttpCode(HttpStatus.OK)
  @Authenticated({ permission: Permission.AssetUpdate })
  @Endpoint({
    summary: 'Create a MemoryDock style transform job',
    description: 'Generates an AI-styled copy of an owned image and imports the result into the user timeline.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  createStyleTransform(@Auth() auth: AuthDto, @Body() dto: MemoryDockStyleTransformDto): Promise<unknown> {
    return this.service.createStyleTransform(auth, dto);
  }
}
