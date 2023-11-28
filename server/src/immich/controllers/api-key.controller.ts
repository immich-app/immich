import {
  APIKeyCreateDto,
  APIKeyCreateResponseDto,
  APIKeyResponseDto,
  APIKeyService,
  APIKeyUpdateDto,
  AuthUserDto,
} from '@app/domain';
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser, Authenticated } from '../app.guard';
import { UseValidation } from '../app.utils';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('API Key')
@Controller('api-key')
@Authenticated()
@UseValidation()
export class APIKeyController {
  constructor(private service: APIKeyService) {}

  @Post()
  createApiKey(@AuthUser() authUser: AuthUserDto, @Body() dto: APIKeyCreateDto): Promise<APIKeyCreateResponseDto> {
    return this.service.create(authUser, dto);
  }

  @Get()
  getApiKeys(@AuthUser() authUser: AuthUserDto): Promise<APIKeyResponseDto[]> {
    return this.service.getAll(authUser);
  }

  @Get(':id')
  getApiKey(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<APIKeyResponseDto> {
    return this.service.getById(authUser, id);
  }

  @Put(':id')
  updateApiKey(
    @AuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: APIKeyUpdateDto,
  ): Promise<APIKeyResponseDto> {
    return this.service.update(authUser, id, dto);
  }

  @Delete(':id')
  deleteApiKey(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(authUser, id);
  }
}
