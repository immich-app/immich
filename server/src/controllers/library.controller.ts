import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Permission } from 'src/dtos/auth.dto';
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
  @Authenticated(Permission.LIBRARY_READ)
  getAllLibraries(@Query() dto: SearchLibraryDto): Promise<LibraryResponseDto[]> {
    return this.service.getAll(dto);
  }

  @Post()
  @Authenticated(Permission.LIBRARY_CREATE)
  createLibrary(@Body() dto: CreateLibraryDto): Promise<LibraryResponseDto> {
    return this.service.create(dto);
  }

  @Put(':id')
  @Authenticated(Permission.LIBRARY_UPDATE)
  updateLibrary(@Param() { id }: UUIDParamDto, @Body() dto: UpdateLibraryDto): Promise<LibraryResponseDto> {
    return this.service.update(id, dto);
  }

  @Get(':id')
  @Authenticated(Permission.LIBRARY_READ)
  getLibrary(@Param() { id }: UUIDParamDto): Promise<LibraryResponseDto> {
    return this.service.get(id);
  }

  @Post(':id/validate')
  @Authenticated(Permission.LIBRARY_READ)
  @HttpCode(200)
  // TODO: change endpoint to validate current settings instead
  validate(@Param() { id }: UUIDParamDto, @Body() dto: ValidateLibraryDto): Promise<ValidateLibraryResponseDto> {
    return this.service.validate(id, dto);
  }

  @Delete(':id')
  @Authenticated(Permission.LIBRARY_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteLibrary(@Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(id);
  }

  @Get(':id/statistics')
  @Authenticated(Permission.LIBRARY_READ)
  getLibraryStatistics(@Param() { id }: UUIDParamDto): Promise<LibraryStatsResponseDto> {
    return this.service.getStatistics(id);
  }

  @Post(':id/scan')
  @Authenticated(Permission.LIBRARY_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  scanLibrary(@Param() { id }: UUIDParamDto, @Body() dto: ScanLibraryDto) {
    return this.service.queueScan(id, dto);
  }

  @Post(':id/removeOffline')
  @Authenticated(Permission.LIBRARY_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeOfflineFiles(@Param() { id }: UUIDParamDto) {
    return this.service.queueRemoveOffline(id);
  }
}
