import { AuthUserDto } from '@app/domain';
import { AdminRoute, Authenticated, AuthUser } from '@app/immich/app.guard';
import { UseValidation } from '@app/immich/app.utils';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateLibraryDto } from './dto/create-library-dto';
import { LibraryService } from './library.service';
import { LibraryResponseDto } from './response-dto/library-response.dto';

@ApiTags('Library')
@Controller('Library')
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
}
