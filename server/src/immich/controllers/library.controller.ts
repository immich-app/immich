import {
  AuthDto,
  CreateLibraryDto as CreateDto,
  LibraryService,
  LibraryStatsResponseDto,
  LibraryResponseDto as ResponseDto,
  ScanLibraryDto,
  UpdateLibraryDto as UpdateDto,
} from '@app/domain';
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser, Authenticated } from '../app.guard';
import { UseValidation } from '../app.utils';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('Library')
@Controller('library')
@Authenticated()
@UseValidation()
export class LibraryController {
  constructor(private service: LibraryService) {}

  @Get()
  getLibraries(@AuthUser() auth: AuthDto): Promise<ResponseDto[]> {
    return this.service.getAllForUser(auth);
  }

  @Post()
  createLibrary(@AuthUser() auth: AuthDto, @Body() dto: CreateDto): Promise<ResponseDto> {
    return this.service.create(auth, dto);
  }

  @Put(':id')
  updateLibrary(
    @AuthUser() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: UpdateDto,
  ): Promise<ResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Get(':id')
  getLibraryInfo(@AuthUser() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<ResponseDto> {
    return this.service.get(auth, id);
  }

  @Delete(':id')
  deleteLibrary(@AuthUser() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }

  @Get(':id/statistics')
  getLibraryStatistics(@AuthUser() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<LibraryStatsResponseDto> {
    return this.service.getStatistics(auth, id);
  }

  @Post(':id/scan')
  scanLibrary(@AuthUser() auth: AuthDto, @Param() { id }: UUIDParamDto, @Body() dto: ScanLibraryDto) {
    return this.service.queueScan(auth, id, dto);
  }

  @Post(':id/removeOffline')
  removeOfflineFiles(@AuthUser() auth: AuthDto, @Param() { id }: UUIDParamDto) {
    return this.service.queueRemoveOffline(auth, id);
  }
}
