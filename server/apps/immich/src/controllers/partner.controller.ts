import { PartnerDirection, PartnerService, UserResponseDto } from '@app/domain';
import { Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthUserDto, GetAuthUser } from '../decorators/auth-user.decorator';
import { Authenticated } from '../decorators/authenticated.decorator';
import { UseValidation } from '../decorators/use-validation.decorator';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('Partner')
@Controller('partner')
@UseValidation()
export class PartnerController {
  constructor(private service: PartnerService) {}

  @Authenticated()
  @Get()
  @ApiQuery({ name: 'direction', type: 'string', enum: PartnerDirection, required: true })
  getPartners(
    @GetAuthUser() authUser: AuthUserDto,
    @Query('direction') direction: PartnerDirection,
  ): Promise<UserResponseDto[]> {
    return this.service.getPartners(authUser, direction);
  }

  @Authenticated()
  @Post(':id')
  addPartner(@GetAuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<UserResponseDto> {
    return this.service.addPartner(authUser, id);
  }

  @Authenticated()
  @Delete(':id')
  removePartner(@GetAuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.removePartner(authUser, id);
  }
}
