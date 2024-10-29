import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreateLibraryDto,
  LibraryResponseDto,
  LibraryStatsResponseDto,
  UpdateLibraryDto,
  ValidateLibraryDto,
  ValidateLibraryResponseDto,
} from 'src/dtos/library.dto';
import { Permission } from 'src/enum';
import { Authenticated } from 'src/middleware/auth.guard';
import { LibraryService } from 'src/services/library.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Libraries')
@Controller('libraries')
export class LibraryController {
  constructor(private service: LibraryService) {}

  @Get()
  @Authenticated({ permission: Permission.LIBRARY_READ, admin: true })
  getAllLibraries(): Promise<LibraryResponseDto[]> {
    return this.service.getAll();
  }

  @Post()
  @Authenticated({ permission: Permission.LIBRARY_CREATE, admin: true })
  createLibrary(@Body() dto: CreateLibraryDto): Promise<LibraryResponseDto> {
    return this.service.create(dto);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.LIBRARY_READ, admin: true })
  getLibrary(@Param() { id }: UUIDParamDto): Promise<LibraryResponseDto> {
    return this.service.get(id);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.LIBRARY_UPDATE, admin: true })
  updateLibrary(@Param() { id }: UUIDParamDto, @Body() dto: UpdateLibraryDto): Promise<LibraryResponseDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated({ permission: Permission.LIBRARY_DELETE, admin: true })
  deleteLibrary(@Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(id);
  }

  @Post(':id/validate')
  @HttpCode(200)
  @Authenticated({ admin: true })
  // TODO: change endpoint to validate current settings instead
  validate(@Param() { id }: UUIDParamDto, @Body() dto: ValidateLibraryDto): Promise<ValidateLibraryResponseDto> {
    return this.service.validate(id, dto);
  }

  @Get(':id/statistics')
  @Authenticated({ permission: Permission.LIBRARY_STATISTICS, admin: true })
  getLibraryStatistics(@Param() { id }: UUIDParamDto): Promise<LibraryStatsResponseDto> {
    return this.service.getStatistics(id);
  }

  @Post(':id/scan')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated({ permission: Permission.LIBRARY_UPDATE, admin: true })
  scanLibrary(@Param() { id }: UUIDParamDto) {
    return this.service.queueScan(id);
  }
}
