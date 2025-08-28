import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { APIKeyCreateDto, APIKeyCreateResponseDto, APIKeyResponseDto, APIKeyUpdateDto } from 'src/dtos/api-key.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { ApiKeyService } from 'src/services/api-key.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('API Keys')
@Controller('api-keys')
export class ApiKeyController {
  constructor(private service: ApiKeyService) {}

  @Post()
  @Authenticated({ permission: Permission.ApiKeyCreate })
  createApiKey(@Auth() auth: AuthDto, @Body() dto: APIKeyCreateDto): Promise<APIKeyCreateResponseDto> {
    return this.service.create(auth, dto);
  }

  @Get()
  @Authenticated({ permission: Permission.ApiKeyRead })
  getApiKeys(@Auth() auth: AuthDto): Promise<APIKeyResponseDto[]> {
    return this.service.getAll(auth);
  }

  @Get('me')
  @Authenticated({ permission: false })
  async getMyApiKey(@Auth() auth: AuthDto): Promise<APIKeyResponseDto> {
    return this.service.getMine(auth);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.ApiKeyRead })
  getApiKey(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<APIKeyResponseDto> {
    return this.service.getById(auth, id);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.ApiKeyUpdate })
  updateApiKey(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: APIKeyUpdateDto,
  ): Promise<APIKeyResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.ApiKeyDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteApiKey(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }
}
