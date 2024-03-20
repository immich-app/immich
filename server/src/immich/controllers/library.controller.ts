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
} from 'src/domain/library/library.dto';
import { LibraryService } from 'src/domain/library/library.service';
import { AdminRoute, Authenticated } from 'src/immich/app.guard';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Library')
@Controller('library')
@Authenticated()
@AdminRoute()
export class LibraryController {
  constructor(private service: LibraryService) {}

  @Get()
  getAllLibraries(@Query() dto: SearchLibraryDto): Promise<LibraryResponseDto[]> {
    return this.service.getAll(dto);
  }

  @Post()
  createLibrary(@Body() dto: CreateLibraryDto): Promise<LibraryResponseDto> {
    return this.service.create(dto);
  }

  @Put(':id')
  updateLibrary(@Param() { id }: UUIDParamDto, @Body() dto: UpdateLibraryDto): Promise<LibraryResponseDto> {
    return this.service.update(id, dto);
  }

  @Get(':id')
  getLibrary(@Param() { id }: UUIDParamDto): Promise<LibraryResponseDto> {
    return this.service.get(id);
  }

  @Post(':id/validate')
  @HttpCode(200)
  // TODO: change endpoint to validate current settings instead
  validate(@Param() { id }: UUIDParamDto, @Body() dto: ValidateLibraryDto): Promise<ValidateLibraryResponseDto> {
    return this.service.validate(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteLibrary(@Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(id);
  }

  @Get(':id/statistics')
  getLibraryStatistics(@Param() { id }: UUIDParamDto): Promise<LibraryStatsResponseDto> {
    return this.service.getStatistics(id);
  }

  @Post(':id/scan')
  @HttpCode(HttpStatus.NO_CONTENT)
  scanLibrary(@Param() { id }: UUIDParamDto, @Body() dto: ScanLibraryDto) {
    return this.service.queueScan(id, dto);
  }

  @Post(':id/removeOffline')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeOfflineFiles(@Param() { id }: UUIDParamDto) {
    return this.service.queueRemoveOffline(id);
  }
}
