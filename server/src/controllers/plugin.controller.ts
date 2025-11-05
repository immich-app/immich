import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PluginResponseDto } from 'src/dtos/plugin.dto';
import { Permission } from 'src/enum';
import { Authenticated } from 'src/middleware/auth.guard';
import { PluginService } from 'src/services/plugin.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Plugins')
@Controller('plugins')
export class PluginController {
  constructor(private service: PluginService) {}

  @Get()
  @Authenticated({ permission: Permission.PluginRead })
  getPlugins(): Promise<PluginResponseDto[]> {
    return this.service.getAll();
  }

  @Get(':id')
  @Authenticated({ permission: Permission.PluginRead })
  getPlugin(@Param() { id }: UUIDParamDto): Promise<PluginResponseDto> {
    return this.service.get(id);
  }
}
