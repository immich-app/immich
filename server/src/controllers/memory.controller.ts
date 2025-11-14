import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { BulkIdResponseDto, BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  MemoryCreateDto,
  MemoryResponseDto,
  MemorySearchDto,
  MemoryStatisticsResponseDto,
  MemoryUpdateDto,
} from 'src/dtos/memory.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { MemoryService } from 'src/services/memory.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.Memories)
@Controller('memories')
export class MemoryController {
  constructor(private service: MemoryService) {}

  @Get()
  @Authenticated({ permission: Permission.MemoryRead })
  @Endpoint({
    summary: 'Retrieve memories',
    description:
      'Retrieve a list of memories. Memories are sorted descending by creation date by default, although they can also be sorted in ascending order, or randomly.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  searchMemories(@Auth() auth: AuthDto, @Query() dto: MemorySearchDto): Promise<MemoryResponseDto[]> {
    return this.service.search(auth, dto);
  }

  @Post()
  @Authenticated({ permission: Permission.MemoryCreate })
  @Endpoint({
    summary: 'Create a memory',
    description:
      'Create a new memory by providing a name, description, and a list of asset IDs to include in the memory.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  createMemory(@Auth() auth: AuthDto, @Body() dto: MemoryCreateDto): Promise<MemoryResponseDto> {
    return this.service.create(auth, dto);
  }

  @Get('statistics')
  @Authenticated({ permission: Permission.MemoryStatistics })
  @Endpoint({
    summary: 'Retrieve memories statistics',
    description: 'Retrieve statistics about memories, such as total count and other relevant metrics.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  memoriesStatistics(@Auth() auth: AuthDto, @Query() dto: MemorySearchDto): Promise<MemoryStatisticsResponseDto> {
    return this.service.statistics(auth, dto);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.MemoryRead })
  @Endpoint({
    summary: 'Retrieve a memory',
    description: 'Retrieve a specific memory by its ID.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getMemory(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<MemoryResponseDto> {
    return this.service.get(auth, id);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.MemoryUpdate })
  @Endpoint({
    summary: 'Update a memory',
    description: 'Update an existing memory by its ID.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  updateMemory(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: MemoryUpdateDto,
  ): Promise<MemoryResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.MemoryDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete a memory',
    description: 'Delete a specific memory by its ID.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  deleteMemory(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(auth, id);
  }

  @Put(':id/assets')
  @Authenticated({ permission: Permission.MemoryAssetCreate })
  @Endpoint({
    summary: 'Add assets to a memory',
    description: 'Add a list of asset IDs to a specific memory.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  addMemoryAssets(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: BulkIdsDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.addAssets(auth, id, dto);
  }

  @Delete(':id/assets')
  @Authenticated({ permission: Permission.MemoryAssetDelete })
  @HttpCode(HttpStatus.OK)
  @Endpoint({
    summary: 'Remove assets from a memory',
    description: 'Remove a list of asset IDs from a specific memory.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  removeMemoryAssets(
    @Auth() auth: AuthDto,
    @Body() dto: BulkIdsDto,
    @Param() { id }: UUIDParamDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.removeAssets(auth, id, dto);
  }
}
