import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CreateLibraryDto,
  LibraryResponseDto,
  LibraryStatsResponseDto,
  UpdateLibraryDto,
  ValidateLibraryDto,
  ValidateLibraryResponseDto,
} from 'src/dtos/library.dto';
import { ApiTag, Permission } from 'src/enum';
import { Authenticated } from 'src/middleware/auth.guard';
import { LibraryService } from 'src/services/library.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.Libraries)
@Controller('libraries')
export class LibraryController {
  constructor(private service: LibraryService) {}

  @Get()
  @Authenticated({ permission: Permission.LibraryRead, admin: true })
  @ApiOperation({
    summary: 'Retrieve libraries',
    description: 'Retrieve a list of external libraries.',
  })
  getAllLibraries(): Promise<LibraryResponseDto[]> {
    return this.service.getAll();
  }

  @Post()
  @Authenticated({ permission: Permission.LibraryCreate, admin: true })
  @ApiOperation({
    summary: 'Create a library',
    description: 'Create a new external library.',
  })
  createLibrary(@Body() dto: CreateLibraryDto): Promise<LibraryResponseDto> {
    return this.service.create(dto);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.LibraryRead, admin: true })
  @ApiOperation({
    summary: 'Retrieve a library',
    description: 'Retrieve an external library by its ID.',
  })
  getLibrary(@Param() { id }: UUIDParamDto): Promise<LibraryResponseDto> {
    return this.service.get(id);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.LibraryUpdate, admin: true })
  @ApiOperation({
    summary: 'Update a library',
    description: 'Update an existing external library.',
  })
  updateLibrary(@Param() { id }: UUIDParamDto, @Body() dto: UpdateLibraryDto): Promise<LibraryResponseDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.LibraryDelete, admin: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a library',
    description: 'Delete an external library by its ID.',
  })
  deleteLibrary(@Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(id);
  }

  @Post(':id/validate')
  @Authenticated({ admin: true })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate library settings',
    description: 'Validate the settings of an external library.',
  })
  // TODO: change endpoint to validate current settings instead
  validate(@Param() { id }: UUIDParamDto, @Body() dto: ValidateLibraryDto): Promise<ValidateLibraryResponseDto> {
    return this.service.validate(id, dto);
  }

  @Get(':id/statistics')
  @Authenticated({ permission: Permission.LibraryStatistics, admin: true })
  @ApiOperation({
    summary: 'Retrieve library statistics',
    description:
      'Retrieve statistics for a specific external library, including number of videos, images, and storage usage.',
  })
  getLibraryStatistics(@Param() { id }: UUIDParamDto): Promise<LibraryStatsResponseDto> {
    return this.service.getStatistics(id);
  }

  @Post(':id/scan')
  @Authenticated({ permission: Permission.LibraryUpdate, admin: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Scan a library',
    description: 'Queue a scan for the external library to find and import new assets.',
  })
  scanLibrary(@Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.queueScan(id);
  }
}
