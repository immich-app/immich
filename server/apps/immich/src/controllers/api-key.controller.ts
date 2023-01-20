import {
  APIKeyCreateDto,
  APIKeyCreateResponseDto,
  APIKeyResponseDto,
  APIKeyService,
  APIKeyUpdateDto,
  AuthUserDto,
} from '@app/domain';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetAuthUser } from '../decorators/auth-user.decorator';
import { Authenticated } from '../decorators/authenticated.decorator';

@ApiTags('API Key')
@Controller('api-key')
@Authenticated()
export class APIKeyController {
  constructor(private service: APIKeyService) {}

  @Post()
  createKey(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) dto: APIKeyCreateDto,
  ): Promise<APIKeyCreateResponseDto> {
    return this.service.create(authUser, dto);
  }

  @Get()
  getKeys(@GetAuthUser() authUser: AuthUserDto): Promise<APIKeyResponseDto[]> {
    return this.service.getAll(authUser);
  }

  @Get(':id')
  getKey(@GetAuthUser() authUser: AuthUserDto, @Param('id', ParseIntPipe) id: number): Promise<APIKeyResponseDto> {
    return this.service.getById(authUser, id);
  }

  @Put(':id')
  updateKey(
    @GetAuthUser() authUser: AuthUserDto,
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) dto: APIKeyUpdateDto,
  ): Promise<APIKeyResponseDto> {
    return this.service.update(authUser, id, dto);
  }

  @Delete(':id')
  deleteKey(@GetAuthUser() authUser: AuthUserDto, @Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.service.delete(authUser, id);
  }
}
