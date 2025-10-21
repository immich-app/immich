import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import { PluginResponseDto, PluginSearchDto, PluginUpdateDto } from 'src/dtos/plugin.dto';
import { Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { PluginService } from 'src/services/plugin.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Plugin')
@Controller('plugins')
export class PluginController {
  constructor(private service: PluginService) {}

  @Get()
  @Authenticated({ admin: true, permission: Permission.PluginRead })
  searchPlugins(@Auth() auth: AuthDto, @Query() dto: PluginSearchDto): Promise<PluginResponseDto[]> {
    return this.service.search(auth, dto);
  }

  @Put(':id')
  @Authenticated({ admin: true, permission: Permission.PluginUpdate })
  updatePlugin(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: PluginUpdateDto,
  ): Promise<PluginResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePlugin(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }
}
