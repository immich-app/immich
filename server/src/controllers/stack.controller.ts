import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { StackCreateDto, StackResponseDto, StackSearchDto, StackUpdateDto } from 'src/dtos/stack.dto';
import { Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { StackService } from 'src/services/stack.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Stacks')
@Controller('stacks')
export class StackController {
  constructor(private service: StackService) {}

  @Get()
  @Authenticated({ permission: Permission.STACK_READ })
  searchStacks(@Auth() auth: AuthDto, @Query() query: StackSearchDto): Promise<StackResponseDto[]> {
    return this.service.search(auth, query);
  }

  @Post()
  @Authenticated({ permission: Permission.STACK_CREATE })
  createStack(@Auth() auth: AuthDto, @Body() dto: StackCreateDto): Promise<StackResponseDto> {
    return this.service.create(auth, dto);
  }

  @Delete()
  @Authenticated({ permission: Permission.STACK_DELETE })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteStacks(@Auth() auth: AuthDto, @Body() dto: BulkIdsDto): Promise<void> {
    return this.service.deleteAll(auth, dto);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.STACK_READ })
  getStack(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<StackResponseDto> {
    return this.service.get(auth, id);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.STACK_UPDATE })
  updateStack(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: StackUpdateDto,
  ): Promise<StackResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated({ permission: Permission.STACK_DELETE })
  deleteStack(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }
}
