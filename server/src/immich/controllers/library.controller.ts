import {
  AuthDto,
  CreateLibraryDto as CreateDto,
  LibraryService,
  LibraryStatsResponseDto,
  LibraryResponseDto as ResponseDto,
  ScanLibraryDto,
  UpdateLibraryDto as UpdateDto,
  ValidateLibraryDto,
  ValidateLibraryResponseDto,
} from '@app/domain';
import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth, Authenticated } from '../app.guard';
import { UseValidation } from '../app.utils';
import { UUIDParamDto } from './dto/uuid-param.dto';

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
  updateLibrary(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto, @Body() dto: UpdateDto): Promise<ResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Get(':id')
  getLibraryInfo(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<ResponseDto> {
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
  deleteLibrary(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }

  @Get(':id/statistics')
  getLibraryStatistics(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<LibraryStatsResponseDto> {
    return this.service.getStatistics(auth, id);
  }

  @Post(':id/scan')
  scanLibrary(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto, @Body() dto: ScanLibraryDto) {
    return this.service.queueScan(auth, id, dto);
  }

  @Post(':id/removeOffline')
  removeOfflineFiles(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto) {
    return this.service.queueRemoveOffline(auth, id);
  }
}
