import {
  AuthUserDto,
  CreateLibraryDto as CreateDto,
  LibraryResponseDto as ResponseDto,
  LibraryService,
  LibraryStatsResponseDto,
  ScanLibraryDto as RefreshLibraryDto,
  UpdateLibraryDto as UpdateDto,
} from '@app/domain';
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated, AuthUser } from '../app.guard';
import { UseValidation } from '../app.utils';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('Library')
@Controller('library')
@Authenticated()
@UseValidation()
export class LibraryController {
  constructor(private service: LibraryService) {}

  @Get()
  getAllLibraries(@AuthUser() authUser: AuthUserDto): Promise<ResponseDto[]> {
    return this.service.getAll(authUser);
  }

  @Post()
  createLibrary(@AuthUser() authUser: AuthUserDto, @Body() dto: CreateDto): Promise<ResponseDto> {
    return this.service.create(authUser, dto);
  }

  // TODO: change to `@Put(':id')
  @Put()
  updateLibrary(@AuthUser() authUser: AuthUserDto, @Body() dto: UpdateDto): Promise<ResponseDto> {
    return this.service.update(authUser, dto);
  }

  @Get('count')
  getLibraryCount(@AuthUser() authUser: AuthUserDto): Promise<number> {
    return this.service.getCount(authUser);
  }

  @Get(':id')
  getLibraryInfo(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<ResponseDto> {
    return this.service.get(authUser, id);
  }

  @Delete(':id')
  deleteLibrary(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(authUser, id);
  }

  @Get('statistics/:id')
  getLibraryStatistics(
    @AuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
  ): Promise<LibraryStatsResponseDto> {
    return this.service.getStatistics(authUser, id);
  }

  @Post('refresh/:id')
  refreshLibrary(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto, @Body() dto: RefreshLibraryDto) {
    return this.service.queueRefresh(authUser, id, dto);
  }

  @Post('trash/:id')
  emptyLibraryTrash(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto) {
    return this.service.emptyTrash(authUser, id);
  }
}
