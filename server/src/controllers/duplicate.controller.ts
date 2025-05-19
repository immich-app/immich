import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import { DeduplicateAllDto, DuplicateResponseDto } from 'src/dtos/duplicate.dto';
import { Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { DuplicateService } from 'src/services/duplicate.service';

@ApiTags('Duplicates')
@Controller('duplicates')
export class DuplicateController {
  constructor(private service: DuplicateService) {}

  @Get()
  @Authenticated()
  getAssetDuplicates(@Auth() auth: AuthDto): Promise<DuplicateResponseDto[]> {
    return this.service.getDuplicates(auth);
  }

  @Post('/bulk/keep')
  @Authenticated({ permission: Permission.ASSET_UPDATE })
  async keepAll(@Auth() auth: AuthDto) {
    await this.service.keepAll(auth);
  }

  @Post('/bulk/deduplicate')
  @Authenticated({ permission: Permission.ASSET_DELETE })
  async deduplicateAll(@Auth() auth: AuthDto, @Body() dto: DeduplicateAllDto) {
    await this.service.deduplicateAll(auth, dto);
  }
}
