import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import { PartnerResponseDto, PartnerSearchDto, UpdatePartnerDto } from 'src/dtos/partner.dto';
import { Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { PartnerService } from 'src/services/partner.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Partners')
@Controller('partners')
export class PartnerController {
  constructor(private service: PartnerService) {}

  @Get()
  @Authenticated({ permission: Permission.PARTNER_READ })
  getPartners(@Auth() auth: AuthDto, @Query() dto: PartnerSearchDto): Promise<PartnerResponseDto[]> {
    return this.service.search(auth, dto);
  }

  @Post(':id')
  @Authenticated({ permission: Permission.PARTNER_CREATE })
  createPartner(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<PartnerResponseDto> {
    return this.service.create(auth, id);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.PARTNER_UPDATE })
  updatePartner(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: UpdatePartnerDto,
  ): Promise<PartnerResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.PARTNER_DELETE })
  removePartner(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(auth, id);
  }
}
