import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthDto, PartnerDirection, PartnerService } from 'src/domain';
import { PartnerResponseDto, UpdatePartnerDto } from 'src/domain/partner/partner.dto';
import { Auth, Authenticated } from '../app.guard';
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
  getPartners(@Auth() auth: AuthDto, @Query('direction') direction: PartnerDirection): Promise<PartnerResponseDto[]> {
    return this.service.getAll(auth, direction);
  }

  @Post(':id')
  createPartner(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<PartnerResponseDto> {
    return this.service.create(auth, id);
  }

  @Put(':id')
  updatePartner(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: UpdatePartnerDto,
  ): Promise<PartnerResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  removePartner(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(auth, id);
  }
}
