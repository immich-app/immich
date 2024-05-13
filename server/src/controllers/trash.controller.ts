import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { TrashService } from 'src/services/trash.service';

@ApiTags('Trash')
@Controller('trash')
export class TrashController {
  constructor(private service: TrashService) {}

  @Post('empty')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated()
  emptyTrash(@Auth() auth: AuthDto): Promise<void> {
    return this.service.empty(auth);
  }

  @Post('restore')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated()
  restoreTrash(@Auth() auth: AuthDto): Promise<void> {
    return this.service.restore(auth);
  }

  @Post('restore/assets')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated()
  restoreAssets(@Auth() auth: AuthDto, @Body() dto: BulkIdsDto): Promise<void> {
    return this.service.restoreAssets(auth, dto);
  }
}
