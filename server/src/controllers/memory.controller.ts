import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BulkIdResponseDto, BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto, Permission } from 'src/dtos/auth.dto';
import { MemoryCreateDto, MemoryResponseDto, MemoryUpdateDto } from 'src/dtos/memory.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { MemoryService } from 'src/services/memory.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Memory')
@Controller('memories')
export class MemoryController {
  constructor(private service: MemoryService) {}

  @Get()
  @Authenticated(Permission.MEMORY_READ)
  searchMemories(@Auth() auth: AuthDto): Promise<MemoryResponseDto[]> {
    return this.service.search(auth);
  }

  @Post()
  @Authenticated(Permission.MEMORY_CREATE)
  createMemory(@Auth() auth: AuthDto, @Body() dto: MemoryCreateDto): Promise<MemoryResponseDto> {
    return this.service.create(auth, dto);
  }

  @Get(':id')
  @Authenticated(Permission.MEMORY_READ)
  getMemory(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<MemoryResponseDto> {
    return this.service.get(auth, id);
  }

  @Put(':id')
  @Authenticated(Permission.MEMORY_UPDATE)
  updateMemory(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: MemoryUpdateDto,
  ): Promise<MemoryResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated(Permission.MEMORY_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMemory(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(auth, id);
  }

  @Put(':id/assets')
  @Authenticated(Permission.MEMORY_ADD_ASSET)
  addMemoryAssets(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: BulkIdsDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.addAssets(auth, id, dto);
  }

  @Delete(':id/assets')
  @Authenticated(Permission.MEMORY_REMOVE_ASSET)
  @HttpCode(HttpStatus.OK)
  removeMemoryAssets(
    @Auth() auth: AuthDto,
    @Body() dto: BulkIdsDto,
    @Param() { id }: UUIDParamDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.removeAssets(auth, id, dto);
  }
}
