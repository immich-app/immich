import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthDto, Permission } from 'src/dtos/auth.dto';
import { PartnerResponseDto, UpdatePartnerDto } from 'src/dtos/partner.dto';
import { PartnerDirection } from 'src/interfaces/partner.interface';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { PartnerService } from 'src/services/partner.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Partner')
@Controller('partner')
export class PartnerController {
  constructor(private service: PartnerService) {}

  @Get()
  @Authenticated(Permission.PARTNER_READ)
  @ApiQuery({ name: 'direction', type: 'string', enum: PartnerDirection, required: true })
  // TODO: remove 'direction' and convert to full query dto
  getPartners(@Auth() auth: AuthDto, @Query('direction') direction: PartnerDirection): Promise<PartnerResponseDto[]> {
    return this.service.getAll(auth, direction);
  }

  @Post(':id')
  @Authenticated(Permission.PARTNER_CREATE)
  createPartner(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<PartnerResponseDto> {
    return this.service.create(auth, id);
  }

  @Put(':id')
  @Authenticated(Permission.PARTNER_UPDATE)
  updatePartner(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: UpdatePartnerDto,
  ): Promise<PartnerResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated(Permission.PARTNER_DELETE)
  removePartner(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(auth, id);
  }
}
