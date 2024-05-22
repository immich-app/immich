import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import { DuplicateResponseDto, ResolveDuplicatesDto } from 'src/dtos/duplicate.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { DuplicateService } from 'src/services/duplicate.service';
import { UUIDParamDto } from '../validation';

@ApiTags('Duplicate')
@Controller('duplicates')
export class DuplicateController {
  constructor(private service: DuplicateService) {}

  @Get()
  @Authenticated()
  getAssetDuplicates(@Auth() auth: AuthDto): Promise<DuplicateResponseDto[]> {
    return this.service.getDuplicates(auth);
  }

  @Post(':id/resolve')
  @HttpCode(200)
  @Authenticated()
  resolveDuplicates(
    @Auth() auth: AuthDto,
    @Param() { id: duplicateId }: UUIDParamDto,
    @Body() dto: ResolveDuplicatesDto,
  ): Promise<void> {
    return this.service.resolveDuplicates(auth, duplicateId, dto);
  }
}
