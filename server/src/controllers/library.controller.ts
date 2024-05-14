import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreateLibraryDto,
  LibraryResponseDto,
  LibraryStatsResponseDto,
  ScanLibraryDto,
  SearchLibraryDto,
  UpdateLibraryDto,
  ValidateLibraryDto,
  ValidateLibraryResponseDto,
} from 'src/dtos/library.dto';
import { Authenticated } from 'src/middleware/auth.guard';
import { LibraryService } from 'src/services/library.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Library')
@Controller('library')
export class LibraryController {
  constructor(private service: LibraryService) {}

  @Get()
  @Authenticated({ admin: true })
  getAllLibraries(@Query() dto: SearchLibraryDto): Promise<LibraryResponseDto[]> {
    return this.service.getAll(dto);
  }

  @Post()
  @Authenticated({ admin: true })
  createLibrary(@Body() dto: CreateLibraryDto): Promise<LibraryResponseDto> {
    return this.service.create(dto);
  }

  @Put(':id')
  @Authenticated({ admin: true })
  updateLibrary(@Param() { id }: UUIDParamDto, @Body() dto: UpdateLibraryDto): Promise<LibraryResponseDto> {
    return this.service.update(id, dto);
  }

  @Get(':id')
  @Authenticated({ admin: true })
  getLibrary(@Param() { id }: UUIDParamDto): Promise<LibraryResponseDto> {
    return this.service.get(id);
  }

  @Post(':id/validate')
  @HttpCode(200)
  @Authenticated({ admin: true })
  // TODO: change endpoint to validate current settings instead
  validate(@Param() { id }: UUIDParamDto, @Body() dto: ValidateLibraryDto): Promise<ValidateLibraryResponseDto> {
    return this.service.validate(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated({ admin: true })
  deleteLibrary(@Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(id);
  }

  @Get(':id/statistics')
  @Authenticated({ admin: true })
  getLibraryStatistics(@Param() { id }: UUIDParamDto): Promise<LibraryStatsResponseDto> {
    return this.service.getStatistics(id);
  }

  @Post(':id/scan')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated({ admin: true })
  scanLibrary(@Param() { id }: UUIDParamDto, @Body() dto: ScanLibraryDto) {
    return this.service.queueScan(id, dto);
  }

  @Post(':id/removeOffline')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated({ admin: true })
  removeOfflineFiles(@Param() { id }: UUIDParamDto) {
    return this.service.queueRemoveOffline(id);
  }
}
