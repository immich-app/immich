import { Body, Controller, Delete, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
  @Authenticated({ permission: Permission.DuplicateRead })
  getAssetDuplicates(@Auth() auth: AuthDto): Promise<DuplicateResponseDto[]> {
    return this.service.getDuplicates(auth);
  }

  @Delete()
  @Authenticated({ permission: Permission.DuplicateDelete })
  deleteDuplicates(@Auth() auth: AuthDto, @Body() dto: BulkIdsDto): Promise<void> {
    return this.service.deleteAll(auth, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.DuplicateDelete })
  deleteDuplicate(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }
}
