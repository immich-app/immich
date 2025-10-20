import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { DuplicateResponseDto } from 'src/dtos/duplicate.dto';
import { Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { DuplicateService } from 'src/services/duplicate.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Duplicates')
@Controller('duplicates')
export class DuplicateController {
  constructor(private service: DuplicateService) {}

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'size', required: false, type: Number, example: 20 })
  @Authenticated({ permission: Permission.DuplicateRead })
  getAssetDuplicates(
    @Auth() auth: AuthDto,
    @Query('page') page: number = 1,
    @Query('size') size: number = 20,
  ): Promise<DuplicateResponseDto> {
    return this.service.getDuplicates(auth, page, size);
  }

  @Delete()
  @Authenticated({ permission: Permission.DuplicateDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteDuplicates(@Auth() auth: AuthDto, @Body() dto: BulkIdsDto): Promise<void> {
    return this.service.deleteAll(auth, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.DuplicateDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteDuplicate(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }
}
