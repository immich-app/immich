import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators.js';
import type { AuthDto } from 'src/dtos/auth.dto.js';
import { PartnerCreateDto, PartnerResponseDto, PartnerSearchDto, PartnerUpdateDto } from 'src/dtos/partner.dto.js';
import { ApiTag, Permission } from 'src/enum.js';
import { Auth, Authenticated } from 'src/middleware/auth.guard.js';
import { PartnerService } from 'src/services/partner.service.js';
import { UUIDParamDto } from 'src/validation.js';

@ApiTags(ApiTag.Partners)
@Controller('partners')
export class PartnerController {
  constructor(private service: PartnerService) {}

  @Get()
  @Authenticated({ permission: Permission.PartnerRead })
  @Endpoint({
    summary: 'Retrieve partners',
    description: 'Retrieve a list of partners with whom assets are shared.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getPartners(@Auth() auth: AuthDto, @Query() dto: PartnerSearchDto): Promise<PartnerResponseDto[]> {
    return this.service.search(auth, dto);
  }

  @Post()
  @Authenticated({ permission: Permission.PartnerCreate })
  @Endpoint({
    summary: 'Create a partner',
    description: 'Create a new partner to share assets with.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  createPartner(@Auth() auth: AuthDto, @Body() dto: PartnerCreateDto): Promise<PartnerResponseDto> {
    return this.service.create(auth, dto);
  }

  @Post(':id')
  @Endpoint({
    summary: 'Create a partner',
    description: 'Create a new partner to share assets with.',
    history: new HistoryBuilder().added('v1').deprecated('v1', { replacementId: 'createPartner' }),
  })
  @Authenticated({ permission: Permission.PartnerCreate })
  createPartnerDeprecated(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<PartnerResponseDto> {
    return this.service.create(auth, { sharedWithId: id });
  }

  @Put(':id')
  @Authenticated({ permission: Permission.PartnerUpdate })
  @Endpoint({
    summary: 'Update a partner',
    description: "Specify whether a partner's assets should appear in the user's timeline.",
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
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
  @Endpoint({
    summary: 'Remove a partner',
    description: 'Stop sharing assets with a partner.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  removePartner(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(auth, id);
  }
}
