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
import { Auth, Authenticated } from '../app.guard';
import { UseValidation } from '../app.utils';
import { UUIDParamDto as UIDParameterDto } from './dto/uuid-param.dto';

@ApiTags('Library')
@Controller('library')
@Authenticated()
@UseValidation()
export class LibraryController {
  constructor(private service: LibraryService) {}

  @Get()
  getLibraries(@Auth() auth: AuthDto): Promise<ResponseDto[]> {
    return this.service.getAllForUser(auth);
  }

  @Post()
  createLibrary(@Auth() auth: AuthDto, @Body() dto: CreateDto): Promise<ResponseDto> {
    return this.service.create(auth, dto);
  }

  @Put(':id')
  updateLibrary(@Auth() auth: AuthDto, @Param() { id }: UIDParameterDto, @Body() dto: UpdateDto): Promise<ResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Get(':id')
  getLibraryInfo(@Auth() auth: AuthDto, @Param() { id }: UIDParameterDto): Promise<ResponseDto> {
    return this.service.get(auth, id);
  }

  @Delete(':id')
  deleteLibrary(@Auth() auth: AuthDto, @Param() { id }: UIDParameterDto): Promise<void> {
    return this.service.delete(auth, id);
  }

  @Get(':id/statistics')
  getLibraryStatistics(@Auth() auth: AuthDto, @Param() { id }: UIDParameterDto): Promise<LibraryStatsResponseDto> {
    return this.service.getStatistics(auth, id);
  }

  @Post(':id/scan')
  scanLibrary(@Auth() auth: AuthDto, @Param() { id }: UIDParameterDto, @Body() dto: ScanLibraryDto) {
    return this.service.queueScan(auth, id, dto);
  }

  @Post(':id/removeOffline')
  removeOfflineFiles(@Auth() auth: AuthDto, @Param() { id }: UIDParameterDto) {
    return this.service.queueRemoveOffline(auth, id);
  }
}
