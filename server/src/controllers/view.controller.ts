import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved unique paths', type: [String] })
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
  @ApiQuery({ name: 'path', description: 'Original path of the folder', type: String, required: true })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved assets by original path',
    type: [AssetResponseDto],
  })
  @Endpoint({
    summary: 'Retrieve assets by original path',
    description: 'Retrieve assets that are children of a specific folder.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getAssetsByOriginalPath(@Auth() auth: AuthDto, @Query('path') path: string): Promise<AssetResponseDto[]> {
    return this.service.getAssetsByOriginalPath(auth, path);
  }
}
