import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
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
  @Endpoint({
    summary: 'List all plugins',
    description: 'Retrieve a list of plugins available to the authenticated user.',
    history: new HistoryBuilder().added('v2.3.0').alpha('v2.3.0'),
  })
  getPlugins(): Promise<PluginResponseDto[]> {
    return this.service.getAll();
  }

  @Get(':id')
  @Authenticated({ permission: Permission.PluginRead })
  @Endpoint({
    summary: 'Retrieve a plugin',
    description: 'Retrieve information about a specific plugin by its ID.',
    history: new HistoryBuilder().added('v2.3.0').alpha('v2.3.0'),
  })
  getPlugin(@Param() { id }: UUIDParamDto): Promise<PluginResponseDto> {
    return this.service.get(id);
  }
}
