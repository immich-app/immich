import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import {
  PluginMethodResponseDto,
  PluginMethodSearchDto,
  PluginResponseDto,
  PluginSearchDto,
} from 'src/dtos/plugin.dto';
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
    history: HistoryBuilder.v3(),
  })
  searchPlugins(@Query() dto: PluginSearchDto): Promise<PluginResponseDto[]> {
    return this.service.search(dto);
  }

  @Get('methods')
  @Authenticated({ permission: Permission.PluginRead })
  @Endpoint({
    summary: 'Retrieve plugin methods',
    description: 'Retrieve a list of plugin methods',
    history: HistoryBuilder.v3(),
  })
  searchPluginMethods(@Query() dto: PluginMethodSearchDto): Promise<PluginMethodResponseDto[]> {
    return this.service.searchMethods(dto);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.PluginRead })
  @Endpoint({
    summary: 'Retrieve a plugin',
    description: 'Retrieve information about a specific plugin by its ID.',
    history: HistoryBuilder.v3(),
  })
  getPlugin(@Param() { id }: UUIDParamDto): Promise<PluginResponseDto> {
    return this.service.get(id);
  }
}
