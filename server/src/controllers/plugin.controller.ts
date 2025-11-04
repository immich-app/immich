import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import { PluginResponseDto } from 'src/dtos/plugin.dto';
import { Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { PluginService } from 'src/services/plugin.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Plugins')
@Controller('plugins')
export class PluginController {
  constructor(private service: PluginService) {}

  @Get()
  @Authenticated({ permission: Permission.PluginRead })
  getPlugins(@Auth() auth: AuthDto): Promise<PluginResponseDto[]> {
    return this.service.getAll(auth);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.PluginRead })
  getPlugin(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<PluginResponseDto> {
    return this.service.get(auth, id);
  }
}
