import { SystemConfigService } from '@app/domain';
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UseValidation } from '../decorators/use-validation.decorator';
import { SystemConfigDisplayDto } from '@app/domain/system-config/dto/system-config-display.dto';

@ApiTags('Accent Colors')
@Controller('accent-colors')
@UseValidation()
export class AccentColorsController {
  constructor(private readonly service: SystemConfigService) {}

  @Get()
  getColors(): Promise<SystemConfigDisplayDto> {
    return this.service.getAccentColors();
  }
}
