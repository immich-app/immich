import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BulkIdResponseDto, BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  MemoryCreateDto,
  MemoryResponseDto,
  MemorySearchDto,
  MemoryStatisticsResponseDto,
  MemoryUpdateDto,
} from 'src/dtos/memory.dto';
import { Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { MemoryService } from 'src/services/memory.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Memories')
@Controller('memories')
export class MemoryController {
  constructor(private service: MemoryService) {}

  @Get()
  @Authenticated({ permission: Permission.MemoryRead })
  searchMemories(@Auth() auth: AuthDto, @Query() dto: MemorySearchDto): Promise<MemoryResponseDto[]> {
    return this.service.search(auth, dto);
  }

  @Post()
  @Authenticated({ permission: Permission.MemoryCreate })
  createMemory(@Auth() auth: AuthDto, @Body() dto: MemoryCreateDto): Promise<MemoryResponseDto> {
    return this.service.create(auth, dto);
  }

  @Get('statistics')
  @Authenticated({ permission: Permission.MemoryStatistics })
  memoriesStatistics(@Auth() auth: AuthDto, @Query() dto: MemorySearchDto): Promise<MemoryStatisticsResponseDto> {
    return this.service.statistics(auth, dto);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.MemoryRead })
  getMemory(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<MemoryResponseDto> {
    return this.service.get(auth, id);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.MemoryUpdate })
  updateMemory(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: MemoryUpdateDto,
  ): Promise<MemoryResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated({ permission: Permission.MemoryDelete })
  deleteMemory(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(auth, id);
  }

  @Put(':id/assets')
  @Authenticated({ permission: Permission.MemoryAssetCreate })
  addMemoryAssets(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: BulkIdsDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.addAssets(auth, id, dto);
  }

  @Delete(':id/assets')
  @HttpCode(HttpStatus.OK)
  @Authenticated({ permission: Permission.MemoryAssetDelete })
  removeMemoryAssets(
    @Auth() auth: AuthDto,
    @Body() dto: BulkIdsDto,
    @Param() { id }: UUIDParamDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.removeAssets(auth, id, dto);
  }
}
