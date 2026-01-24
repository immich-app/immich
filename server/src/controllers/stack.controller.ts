import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { StackCreateDto, StackResponseDto, StackSearchDto, StackUpdateDto } from 'src/dtos/stack.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { StackService } from 'src/services/stack.service';
import { UUIDAssetIDParamDto, UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.Stacks)
@Controller('stacks')
export class StackController {
  constructor(private service: StackService) {}

  @Get()
  @Authenticated({ permission: Permission.StackRead })
  @Endpoint({
    summary: 'Retrieve stacks',
    description: 'Retrieve a list of stacks.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  searchStacks(@Auth() auth: AuthDto, @Query() query: StackSearchDto): Promise<StackResponseDto[]> {
    return this.service.search(auth, query);
  }

  @Post()
  @Authenticated({ permission: Permission.StackCreate })
  @Endpoint({
    summary: 'Create a stack',
    description:
      'Create a new stack by providing a name and a list of asset IDs to include in the stack. If any of the provided asset IDs are primary assets of an existing stack, the existing stack will be merged into the newly created stack.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  createStack(@Auth() auth: AuthDto, @Body() dto: StackCreateDto): Promise<StackResponseDto> {
    return this.service.create(auth, dto);
  }

  @Delete()
  @Authenticated({ permission: Permission.StackDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete stacks',
    description: 'Delete multiple stacks by providing a list of stack IDs.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  deleteStacks(@Auth() auth: AuthDto, @Body() dto: BulkIdsDto): Promise<void> {
    return this.service.deleteAll(auth, dto);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.StackRead })
  @Endpoint({
    summary: 'Retrieve a stack',
    description: 'Retrieve a specific stack by its ID.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getStack(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<StackResponseDto> {
    return this.service.get(auth, id);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.StackUpdate })
  @Endpoint({
    summary: 'Update a stack',
    description: 'Update an existing stack by its ID.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  updateStack(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: StackUpdateDto,
  ): Promise<StackResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.StackDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete a stack',
    description: 'Delete a specific stack by its ID.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  deleteStack(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }

  @Delete(':id/assets/:assetId')
  @Authenticated({ permission: Permission.StackUpdate })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Remove an asset from a stack',
    description: 'Remove a specific asset from a stack by providing the stack ID and asset ID.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  removeAssetFromStack(@Auth() auth: AuthDto, @Param() dto: UUIDAssetIDParamDto): Promise<void> {
    return this.service.removeAsset(auth, dto);
  }
}
