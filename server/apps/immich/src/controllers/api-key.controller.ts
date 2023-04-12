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
import { GetAuthUser } from '../decorators/auth-user.decorator';
import { Authenticated } from '../decorators/authenticated.decorator';
import { UseValidation } from '../decorators/use-validation.decorator';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('API Key')
@Controller('api-key')
@Authenticated()
@UseValidation()
export class APIKeyController {
  constructor(private service: APIKeyService) {}

  @Post()
  createKey(@GetAuthUser() authUser: AuthUserDto, @Body() dto: APIKeyCreateDto): Promise<APIKeyCreateResponseDto> {
    return this.service.create(authUser, dto);
  }

  @Get()
  getKeys(@GetAuthUser() authUser: AuthUserDto): Promise<APIKeyResponseDto[]> {
    return this.service.getAll(authUser);
  }

  @Get(':id')
  getKey(@GetAuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<APIKeyResponseDto> {
    return this.service.getById(authUser, id);
  }

  @Put(':id')
  updateKey(
    @GetAuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: APIKeyUpdateDto,
  ): Promise<APIKeyResponseDto> {
    return this.service.update(authUser, id, dto);
  }

  @Delete(':id')
  deleteKey(@GetAuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(authUser, id);
  }
}
