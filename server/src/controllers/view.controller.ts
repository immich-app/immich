import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { ApiTag } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { ViewService } from 'src/services/view.service';

@ApiTags(ApiTag.Views)
@Controller('view')
export class ViewController {
  constructor(private service: ViewService) {}

  @Get('folder/unique-paths')
  @Authenticated()
  @Endpoint({
    summary: 'Retrieve unique paths',
    description: 'Retrieve a list of unique folder paths from asset original paths.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getUniqueOriginalPaths(@Auth() auth: AuthDto): Promise<string[]> {
    return this.service.getUniqueOriginalPaths(auth);
  }

  @Get('folder')
  @Authenticated()
  @Endpoint({
    summary: 'Retrieve assets by original path',
    description: 'Retrieve assets that are children of a specific folder.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getAssetsByOriginalPath(@Auth() auth: AuthDto, @Query('path') path: string): Promise<AssetResponseDto[]> {
    return this.service.getAssetsByOriginalPath(auth, path);
  }
}
