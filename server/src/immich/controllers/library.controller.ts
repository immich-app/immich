import {
  AuthDto,
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
import { AdminRoute, Auth, Authenticated } from '../app.guard';
import { UseValidation } from '../app.utils';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('Library')
@Controller('library')
@Authenticated()
@UseValidation()
@AdminRoute()
export class LibraryController {
  constructor(private service: LibraryService) {}

  @Get()
  getAllLibraries(@Auth() auth: AuthDto, @Query() dto: SearchLibraryDto): Promise<ResponseDto[]> {
    return this.service.getAll(auth, dto);
  }

  @Post()
  createLibrary(@Auth() auth: AuthDto, @Body() dto: CreateDto): Promise<ResponseDto> {
    return this.service.create(auth, dto);
  }

  @Put(':id')
  updateLibrary(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto, @Body() dto: UpdateDto): Promise<ResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Get(':id')
  getLibrary(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<ResponseDto> {
    return this.service.get(auth, id);
  }

  @Post(':id/validate')
  @HttpCode(200)
  validate(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: ValidateLibraryDto,
  ): Promise<ValidateLibraryResponseDto> {
    return this.service.validate(auth, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteLibrary(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }

  @Get(':id/statistics')
  getLibraryStatistics(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<LibraryStatsResponseDto> {
    return this.service.getStatistics(auth, id);
  }

  @Post(':id/scan')
  @HttpCode(HttpStatus.NO_CONTENT)
  scanLibrary(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto, @Body() dto: ScanLibraryDto) {
    return this.service.queueScan(auth, id, dto);
  }

  @Post(':id/removeOffline')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeOfflineFiles(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto) {
    return this.service.queueRemoveOffline(auth, id);
  }
}
