import {
  CreateLibraryDto as CreateDto,
  LibraryService,
  LibraryStatsResponseDto,
  LibraryResponseDto as ResponseDto,
  ScanLibraryDto,
  SearchLibraryDto,
  UpdateLibraryDto as UpdateDto,
  ValidateLibraryDto,
  ValidateLibraryResponseDto,
} from '@app/domain';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminRoute, Authenticated } from '../app.guard';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('Library')
@Controller('library')
@Authenticated()
@AdminRoute()
export class LibraryController {
  constructor(private service: LibraryService) {}

  @Get()
  getAllLibraries(@Query() dto: SearchLibraryDto): Promise<ResponseDto[]> {
    return this.service.getAll(dto);
  }

  @Post()
  createLibrary(@Body() dto: CreateDto): Promise<ResponseDto> {
    return this.service.create(dto);
  }

  @Put(':id')
  updateLibrary(@Param() { id }: UUIDParamDto, @Body() dto: UpdateDto): Promise<ResponseDto> {
    return this.service.update(id, dto);
  }

  @Get(':id')
  getLibrary(@Param() { id }: UUIDParamDto): Promise<ResponseDto> {
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
