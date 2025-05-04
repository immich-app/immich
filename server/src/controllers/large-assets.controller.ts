import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import { LargeAssetsResponseDto } from 'src/dtos/large-assets.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { LargeAssetsService } from 'src/services/large-assets.service';

@ApiTags('LargeAssets')
@Controller('large-assets')
export class LargeAssetsController {
  constructor(private service: LargeAssetsService) { }

  @Get()
  @Authenticated()
  getLargeAssets(@Auth() auth: AuthDto): Promise<LargeAssetsResponseDto> {
    return this.service.getLargeAssets(auth);
  }
}
