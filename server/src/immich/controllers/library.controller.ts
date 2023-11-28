import {
  AuthUserDto,
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
  getLibraries(@AuthUser() authUser: AuthUserDto): Promise<ResponseDto[]> {
    return this.service.getAllForUser(authUser);
  }

  @Post()
  createLibrary(@AuthUser() authUser: AuthUserDto, @Body() dto: CreateDto): Promise<ResponseDto> {
    return this.service.create(authUser, dto);
  }

  @Put(':id')
  updateLibrary(
    @AuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: UpdateDto,
  ): Promise<ResponseDto> {
    return this.service.update(authUser, id, dto);
  }

  @Get(':id')
  getLibraryInfo(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<ResponseDto> {
    return this.service.get(authUser, id);
  }

  @Delete(':id')
  deleteLibrary(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(authUser, id);
  }

  @Get(':id/statistics')
  getLibraryStatistics(
    @AuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
  ): Promise<LibraryStatsResponseDto> {
    return this.service.getStatistics(authUser, id);
  }

  @Post(':id/scan')
  scanLibrary(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto, @Body() dto: ScanLibraryDto) {
    return this.service.queueScan(authUser, id, dto);
  }

  @Post(':id/removeOffline')
  removeOfflineFiles(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto) {
    return this.service.queueRemoveOffline(authUser, id);
  }
}
