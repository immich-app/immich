import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { TrashResponseDto } from 'src/dtos/trash.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { TrashService } from 'src/services/trash.service';

@ApiTags(ApiTag.Trash)
@Controller('trash')
export class TrashController {
  constructor(private service: TrashService) {}

  @Post('empty')
  @Authenticated({ permission: Permission.AssetDelete })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Empty trash',
    description: 'Permanently delete all items in the trash.',
  })
  emptyTrash(@Auth() auth: AuthDto): Promise<TrashResponseDto> {
    return this.service.empty(auth);
  }

  @Post('restore')
  @Authenticated({ permission: Permission.AssetDelete })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restore trash',
    description: 'Restore all items in the trash.',
  })
  restoreTrash(@Auth() auth: AuthDto): Promise<TrashResponseDto> {
    return this.service.restore(auth);
  }

  @Post('restore/assets')
  @Authenticated({ permission: Permission.AssetDelete })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restore assets',
    description: 'Restore specific assets from the trash.',
  })
  restoreAssets(@Auth() auth: AuthDto, @Body() dto: BulkIdsDto): Promise<TrashResponseDto> {
    return this.service.restoreAssets(auth, dto);
  }
}
