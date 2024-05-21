import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import { DuplicateResponseDto, ResolveDuplicatesDto } from 'src/dtos/duplicate.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { DuplicateService } from 'src/services/duplicate.service';

@ApiTags('Duplicate')
@Controller('duplicates')
export class DuplicateController {
  constructor(private service: DuplicateService) {}

  @Get()
  @Authenticated()
  getAssetDuplicates(@Auth() auth: AuthDto): Promise<DuplicateResponseDto[]> {
    return this.service.getDuplicates(auth);
  }

  @Post('/resolve')
  @Authenticated()
  resolveDuplicates(@Auth() auth: AuthDto, @Body() dto: ResolveDuplicatesDto): Promise<void> {
    return this.service.resolveDuplicates(auth, dto);
  }
}
