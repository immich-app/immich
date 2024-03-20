import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TrashService } from 'src/domain/trash/trash.service';
import { BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';

@ApiTags('Trash')
@Controller('trash')
@Authenticated()
export class TrashController {
  constructor(private service: TrashService) {}

  @Post('empty')
  @HttpCode(HttpStatus.NO_CONTENT)
  emptyTrash(@Auth() auth: AuthDto): Promise<void> {
    return this.service.empty(auth);
  }

  @Post('restore')
  @HttpCode(HttpStatus.NO_CONTENT)
  restoreTrash(@Auth() auth: AuthDto): Promise<void> {
    return this.service.restore(auth);
  }

  @Post('restore/assets')
  @HttpCode(HttpStatus.NO_CONTENT)
  restoreAssets(@Auth() auth: AuthDto, @Body() dto: BulkIdsDto): Promise<void> {
    return this.service.restoreAssets(auth, dto);
  }
}
