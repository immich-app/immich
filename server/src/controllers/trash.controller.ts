import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { TrashResponseDto } from 'src/dtos/trash.dto';
import { Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { TrashService } from 'src/services/trash.service';

@ApiTags('Trash')
@Controller('trash')
export class TrashController {
  constructor(private service: TrashService) {}

  @Post('empty')
  @HttpCode(HttpStatus.OK)
  @Authenticated({ permission: Permission.ASSET_DELETE })
  emptyTrash(@Auth() auth: AuthDto): Promise<TrashResponseDto> {
    return this.service.empty(auth);
  }

  @Post('restore')
  @HttpCode(HttpStatus.OK)
  @Authenticated({ permission: Permission.ASSET_DELETE })
  restoreTrash(@Auth() auth: AuthDto): Promise<TrashResponseDto> {
    return this.service.restore(auth);
  }

  @Post('restore/assets')
  @HttpCode(HttpStatus.OK)
  @Authenticated({ permission: Permission.ASSET_DELETE })
  restoreAssets(@Auth() auth: AuthDto, @Body() dto: BulkIdsDto): Promise<TrashResponseDto> {
    return this.service.restoreAssets(auth, dto);
  }
}
