import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiBody, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { APIKeyCreateDto, APIKeyCreateResponseDto, APIKeyResponseDto, APIKeyUpdateDto } from 'src/dtos/api-key.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { ApiKeyService } from 'src/services/api-key.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.ApiKeys)
@Controller('api-keys')
export class ApiKeyController {
  constructor(private service: ApiKeyService) {}

  @Post()
  @Authenticated({ permission: Permission.ApiKeyCreate })
  @ApiBody({ description: 'API key creation data with name and permissions', type: APIKeyCreateDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'API key created successfully',
    type: APIKeyCreateResponseDto,
  })
  @Endpoint({
    summary: 'Create an API key',
    description: 'Creates a new API key. It will be limited to the permissions specified.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  createApiKey(@Auth() auth: AuthDto, @Body() dto: APIKeyCreateDto): Promise<APIKeyCreateResponseDto> {
    return this.service.create(auth, dto);
  }

  @Get()
  @Authenticated({ permission: Permission.ApiKeyRead })
  @ApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved API keys', type: [APIKeyResponseDto] })
  @Endpoint({
    summary: 'List all API keys',
    description: 'Retrieve all API keys of the current user.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getApiKeys(@Auth() auth: AuthDto): Promise<APIKeyResponseDto[]> {
    return this.service.getAll(auth);
  }

  @Get('me')
  @Authenticated({ permission: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved current API key',
    type: APIKeyResponseDto,
  })
  @Endpoint({
    summary: 'Retrieve the current API key',
    description: 'Retrieve the API key that is used to access this endpoint.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  async getMyApiKey(@Auth() auth: AuthDto): Promise<APIKeyResponseDto> {
    return this.service.getMine(auth);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.ApiKeyRead })
  @ApiParam({ name: 'id', description: 'API key ID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved API key', type: APIKeyResponseDto })
  @Endpoint({
    summary: 'Retrieve an API key',
    description: 'Retrieve an API key by its ID. The current user must own this API key.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getApiKey(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<APIKeyResponseDto> {
    return this.service.getById(auth, id);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.ApiKeyUpdate })
  @ApiParam({ name: 'id', description: 'API key ID', type: String, format: 'uuid' })
  @ApiBody({ description: 'Updated API key name and permissions', type: APIKeyUpdateDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'API key updated successfully', type: APIKeyResponseDto })
  @Endpoint({
    summary: 'Update an API key',
    description: 'Updates the name and permissions of an API key by its ID. The current user must own this API key.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
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
  @ApiParam({ name: 'id', description: 'API key ID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'API key deleted successfully' })
  @Endpoint({
    summary: 'Delete an API key',
    description: 'Deletes an API key identified by its ID. The current user must own this API key.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  deleteApiKey(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }
}
