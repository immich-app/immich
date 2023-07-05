import {
  AuthUserDto,
  CreateLibraryDto,
  GetLibrariesDto,
  LibraryResponseDto,
  LibraryService,
  ScanLibraryDto,
} from '@app/domain';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminRoute, Authenticated, AuthUser } from '../app.guard';
import { UseValidation } from '../app.utils';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('Library')
@Controller('library')
@Authenticated()
@UseValidation()
export class LibraryController {
  constructor(private service: LibraryService) {}

  @AdminRoute()
  @Post()
  createLibrary(
    @AuthUser() authUser: AuthUserDto,
    @Body() createLibraryDto: CreateLibraryDto,
  ): Promise<LibraryResponseDto> {
    return this.service.create(authUser, createLibraryDto);
  }

  @Get()
  getAllLibraries(@AuthUser() authUser: AuthUserDto, @Query() dto: GetLibrariesDto): Promise<LibraryResponseDto[]> {
    return this.service.getAll(authUser, dto);
  }

  @Get('count')
  getLibraryCount(@AuthUser() authUser: AuthUserDto): Promise<number> {
    return this.service.getCount(authUser);
  }

  @AdminRoute()
  @Post(':id/scan')
  // TODO: use dto here
  scanLibrary(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto, @Body() dto: ScanLibraryDto) {
    return this.service.scan(authUser, id, dto);
  }
}
