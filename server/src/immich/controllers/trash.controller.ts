import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BulkIdsDto } from 'src/domain/asset/response-dto/asset-ids-response.dto';
import { AuthDto } from 'src/domain/auth/auth.dto';
import { TrashService } from 'src/domain/trash/trash.service';
import { Auth, Authenticated } from 'src/immich/app.guard';

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
