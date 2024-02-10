import {
  APIKeyCreateDto,
  APIKeyCreateResponseDto,
  APIKeyResponseDto,
  APIKeyService,
  APIKeyUpdateDto,
  AuthDto,
} from '@app/domain';
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth, Authenticated } from '../app.guard';
import { UseValidation } from '../app.utils';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('API Key')
@Controller('api-key')
@Authenticated()
@UseValidation()
export class APIKeyController {
  constructor(private service: APIKeyService) {}

  @Post()
  createApiKey(@Auth() auth: AuthDto, @Body() dto: APIKeyCreateDto): Promise<APIKeyCreateResponseDto> {
    return this.service.create(auth, dto);
  }

  @Get()
  getApiKeys(@Auth() auth: AuthDto): Promise<APIKeyResponseDto[]> {
    return this.service.getAll(auth);
  }

  @Get(':id')
  getApiKey(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<APIKeyResponseDto> {
    return this.service.getById(auth, id);
  }

  @Put(':id')
  updateApiKey(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: APIKeyUpdateDto,
  ): Promise<APIKeyResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  deleteApiKey(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }
}
