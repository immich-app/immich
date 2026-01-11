import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiBody, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @Authenticated({ permission: Permission.DuplicateRead })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved duplicates',
    type: [DuplicateResponseDto],
  })
  @Endpoint({
    summary: 'Retrieve duplicates',
    description: 'Retrieve a list of duplicate assets available to the authenticated user.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getAssetDuplicates(@Auth() auth: AuthDto): Promise<DuplicateResponseDto[]> {
    return this.service.getDuplicates(auth);
  }

  @Delete()
  @Authenticated({ permission: Permission.DuplicateDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ description: 'Duplicate asset IDs to delete', type: BulkIdsDto })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Duplicates deleted successfully' })
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
  @ApiParam({ name: 'id', description: 'Duplicate asset ID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Duplicate deleted successfully' })
  @Endpoint({
    summary: 'Delete a duplicate',
    description: 'Delete a single duplicate asset specified by its ID.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  deleteDuplicate(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }
}
