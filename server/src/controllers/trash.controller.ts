import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto, Permission } from 'src/dtos/auth.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { TrashService } from 'src/services/trash.service';

@ApiTags('Trash')
@Controller('trash')
export class TrashController {
  constructor(private service: TrashService) {}

  @Post('empty')
  @Authenticated(Permission.ASSET_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  emptyTrash(@Auth() auth: AuthDto): Promise<void> {
    return this.service.empty(auth);
  }

  @Post('restore')
  @Authenticated(Permission.ASSET_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  restoreTrash(@Auth() auth: AuthDto): Promise<void> {
    return this.service.restore(auth);
  }

  @Post('restore/assets')
  @Authenticated(Permission.ASSET_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  restoreAssets(@Auth() auth: AuthDto, @Body() dto: BulkIdsDto): Promise<void> {
    return this.service.restoreAssets(auth, dto);
  }
}
