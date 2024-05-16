import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { DuplicateService } from 'src/services/duplicate.service';

@ApiTags('Duplicate')
@Controller('duplicate')
export class DuplicateController {
  constructor(private service: DuplicateService) {}

  @Get('duplicates')
  @Authenticated()
  getAssetDuplicates(@Auth() auth: AuthDto): Promise<AssetResponseDto[]> {
    return this.service.getDuplicates(auth);
  }
}
