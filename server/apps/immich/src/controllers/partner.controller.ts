import { Controller, Get, Post, Delete, Param } from '@nestjs/common';
import { PartnerService } from '@app/domain';
import { Authenticated } from '../decorators/authenticated.decorator';
import { AuthUserDto, GetAuthUser } from '../decorators/auth-user.decorator';
import { ApiTags } from '@nestjs/swagger';
import { PartnerResponseDto } from '@app/domain';
import { UseValidation } from '../decorators/use-validation.decorator';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('Partner')
@Controller('partner')
@UseValidation()
export class PartnerController {
  constructor(private service: PartnerService) {}

  @Authenticated()
  @Get()
  getAllPartners(@GetAuthUser() authUser: AuthUserDto): Promise<PartnerResponseDto[]> {
    return this.service.getAllPartners(authUser);
  }

  @Authenticated()
  @Post(':id')
  addPartner(@GetAuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.addPartner(authUser, id);
  }

  @Authenticated()
  @Delete(':id')
  removePartner(@GetAuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.removePartner(authUser, id);
  }
}
