import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EndpointLifecycle } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { PartnerCreateDto, PartnerResponseDto, PartnerSearchDto, PartnerUpdateDto } from 'src/dtos/partner.dto';
import { Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { PartnerService } from 'src/services/partner.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Partners')
@Controller('partners')
export class PartnerController {
  constructor(private service: PartnerService) {}

  @Get()
  @Authenticated({ permission: Permission.PartnerRead })
  getPartners(@Auth() auth: AuthDto, @Query() dto: PartnerSearchDto): Promise<PartnerResponseDto[]> {
    return this.service.search(auth, dto);
  }

  @Post()
  @Authenticated({ permission: Permission.PartnerCreate })
  createPartner(@Auth() auth: AuthDto, @Body() dto: PartnerCreateDto): Promise<PartnerResponseDto> {
    return this.service.create(auth, dto);
  }

  @Post(':id')
  @EndpointLifecycle({ deprecatedAt: 'v1.141.0' })
  @Authenticated({ permission: Permission.PartnerCreate })
  createPartnerDeprecated(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<PartnerResponseDto> {
    return this.service.create(auth, { sharedWithId: id });
  }

  @Put(':id')
  @Authenticated({ permission: Permission.PartnerUpdate })
  updatePartner(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: PartnerUpdateDto,
  ): Promise<PartnerResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.PartnerDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  removePartner(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(auth, id);
  }
}
