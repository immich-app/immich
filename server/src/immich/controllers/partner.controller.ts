import { AuthDto, PartnerDirection, PartnerService } from '@app/domain';
import { PartnerResponseDto, UpdatePartnerDto } from '@app/domain/partner/partner.dto';
import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthUser, Authenticated } from '../app.guard';
import { UseValidation } from '../app.utils';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('Partner')
@Controller('partner')
@Authenticated()
@UseValidation()
export class PartnerController {
  constructor(private service: PartnerService) {}

  @Get()
  @ApiQuery({ name: 'direction', type: 'string', enum: PartnerDirection, required: true })
  getPartners(
    @AuthUser() auth: AuthDto,
    @Query('direction') direction: PartnerDirection,
  ): Promise<PartnerResponseDto[]> {
    return this.service.getAll(auth, direction);
  }

  @Post(':id')
  createPartner(@AuthUser() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<PartnerResponseDto> {
    return this.service.create(auth, id);
  }

  @Put(':id')
  updatePartner(
    @AuthUser() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: UpdatePartnerDto,
  ): Promise<PartnerResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  removePartner(@AuthUser() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(auth, id);
  }
}
