import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { DuplicateResponseDto } from 'src/dtos/duplicate.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { DuplicateService } from 'src/services/duplicate.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.Duplicates)
@Controller('duplicates')
export class DuplicateController {
  constructor(private service: DuplicateService) {}

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'size', required: false, type: Number, example: 20 })
  @Authenticated({ permission: Permission.DuplicateRead })
  @Endpoint({
    summary: 'Retrieve duplicates',
    description: 'Retrieve a list of duplicate assets available to the authenticated user.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getAssetDuplicates(@Auth() auth: AuthDto,     @Query('page') page: number = 1,
    @Query('size') size: number = 20,): Promise<DuplicateResponseDto> {
    return this.service.getDuplicates(auth, page, size);
  }

  @Delete('/de-duplicate-all')
  @Authenticated({ permission: Permission.DuplicateDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  deDuplicateAll(@Auth() auth: AuthDto) {
    return this.service.deDuplicateAll(auth);
  }

  @Delete('/keep-all')
  @Authenticated({ permission: Permission.DuplicateDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  keepAll(@Auth() auth: AuthDto) {
    return this.service.keepAll(auth);
  }

  @Delete()
  @Authenticated({ permission: Permission.DuplicateDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete duplicates',
    description: 'Delete multiple duplicate assets specified by their IDs.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  deleteDuplicates(@Auth() auth: AuthDto, @Body() dto: BulkIdsDto): Promise<void> {
    return this.service.deleteAll(auth, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.DuplicateDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete a duplicate',
    description: 'Delete a single duplicate asset specified by its ID.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  deleteDuplicate(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }
}
