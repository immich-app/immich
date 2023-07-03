import { AuthUserDto } from '@app/domain';
import { ScanLibraryDto  } from '@app/domain/library/dto/scan-library-dto';
import { LibraryService } from '@app/domain/library/library.service';
import { LibraryResponseDto } from '@app/domain/library/response-dto/library-response.dto';
import { AdminRoute, Authenticated, AuthUser } from '@app/immich/app.guard';
import { UseValidation } from '@app/immich/app.utils';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateLibraryDto } from './dto/create-library-dto';

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

  @AdminRoute()
  @Post('/scan')
  // TODO: use dto here
  scan(@AuthUser() authUser: AuthUserDto, @Body() scanLibraryDto: ScanLibraryDto) {
    return this.service.scanLibrary(authUser, scanLibraryDto);
  }
}
