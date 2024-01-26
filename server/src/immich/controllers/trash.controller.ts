import { AuthDto, BulkIdsDto, TrashService } from '@app/domain';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth, Authenticated } from '../app.guard';
import { UseValidation } from '../app.utils';

@ApiTags('Trash')
@Controller('trash')
@Authenticated()
@UseValidation()
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
