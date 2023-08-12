import {
  AuthUserDto,
  CreateRuleDto as CreateDto,
  RuleResponseDto,
  RuleService,
  UpdateRuleDto as UpdateDto,
} from '@app/domain';
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated, AuthUser } from '../app.guard';
import { UseValidation } from '../app.utils';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('Rule')
@Controller('rule')
@Authenticated()
@UseValidation()
export class RuleController {
  constructor(private service: RuleService) {}

  @Post()
  createRule(@AuthUser() authUser: AuthUserDto, @Body() dto: CreateDto): Promise<RuleResponseDto> {
    return this.service.create(authUser, dto);
  }

  @Get(':id')
  getRule(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<RuleResponseDto> {
    return this.service.get(authUser, id);
  }

  @Put(':id')
  updateRule(
    @AuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: UpdateDto,
  ): Promise<RuleResponseDto> {
    return this.service.update(authUser, id, dto);
  }

  @Delete(':id')
  removeRule(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto) {
    return this.service.remove(authUser, id);
  }
}
