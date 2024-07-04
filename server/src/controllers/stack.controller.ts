import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BulkIdResponseDto, BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { StackCreateDto, StackResponseDto, StackUpdateDto } from 'src/dtos/stack.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { StackService } from 'src/services/stack.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Stacks')
@Controller('stacks')
export class StackController {
  constructor(private service: StackService) {}

  @Post()
  createStack(@Auth() auth: AuthDto, @Body() dto: StackCreateDto): Promise<StackResponseDto> {
    return this.service.create(auth, dto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated()
  deleteStacks(@Auth() auth: AuthDto, @Body() dto: BulkIdsDto): Promise<void> {
    return this.service.deleteAll(auth, dto);
  }

  @Get(':id')
  @Authenticated({ sharedLink: true })
  getStack(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<StackResponseDto> {
    return this.service.get(auth, id);
  }

  @Put(':id')
  @Authenticated()
  updateStack(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: StackUpdateDto,
  ): Promise<StackResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated()
  deleteStack(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }

  @Post(':id/merge')
  @Authenticated()
  mergeStacks(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: BulkIdsDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.merge(auth, id, dto);
  }

  @Put(':id/assets')
  @Authenticated()
  addAssetsToStack(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: BulkIdsDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.addAssets(auth, id, dto);
  }

  @Delete(':id/assets')
  @Authenticated()
  removeAssetFromStack(
    @Auth() auth: AuthDto,
    @Body() dto: BulkIdsDto,
    @Param() { id }: UUIDParamDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.removeAssets(auth, id, dto);
  }
}
