import { AuthUserDto } from '@app/domain';
import { CreateLibraryDto } from '@app/domain/library/dto/create-library.dto';
import { GetLibrariesDto } from '@app/domain/library/dto/get-libraries-dto';
import { ScanLibraryDto } from '@app/domain/library/dto/scan-library-dto';
import { LibraryService } from '@app/domain/library/library.service';
import { LibraryResponseDto } from '@app/domain/library/response-dto/library-response.dto';
import { AdminRoute, Authenticated, AuthUser } from '@app/immich/app.guard';
import { UseValidation } from '@app/immich/app.utils';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

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
    return this.service.createLibrary(authUser, createLibraryDto);
  }

  @Get()
  getAllLibrariesasdf(
    @AuthUser() authUser: AuthUserDto,
    @Query() query: GetLibrariesDto,
  ): Promise<LibraryResponseDto[]> {
    return this.service.getAll(authUser, query);
  }

  @Get('count')
  getLibraryCount(@AuthUser() authUser: AuthUserDto): Promise<number> {
    return this.service.getCount(authUser);
  }

  @AdminRoute()
  @Post('/scan')
  // TODO: use dto here
  scan(@AuthUser() authUser: AuthUserDto, @Body() scanLibraryDto: ScanLibraryDto) {
    return this.service.scanLibrary(authUser, scanLibraryDto);
  }
}
