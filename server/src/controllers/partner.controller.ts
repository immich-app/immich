import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EndpointLifecycle } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { PartnerCreateDto, PartnerResponseDto, PartnerSearchDto, PartnerUpdateDto } from 'src/dtos/partner.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { PartnerService } from 'src/services/partner.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.Partners)
@Controller('partners')
export class PartnerController {
  constructor(private service: PartnerService) {}

  @Get()
  @Authenticated({ permission: Permission.PartnerRead })
  @ApiOperation({
    summary: 'Retrieve partners',
    description: 'Retrieve a list of partners with whom assets are shared.',
  })
  getPartners(@Auth() auth: AuthDto, @Query() dto: PartnerSearchDto): Promise<PartnerResponseDto[]> {
    return this.service.search(auth, dto);
  }

  @Post()
  @Authenticated({ permission: Permission.PartnerCreate })
  @ApiOperation({
    summary: 'Create a partner',
    description: 'Create a new partner to share assets with.',
  })
  createPartner(@Auth() auth: AuthDto, @Body() dto: PartnerCreateDto): Promise<PartnerResponseDto> {
    return this.service.create(auth, dto);
  }

  @Post(':id')
  @EndpointLifecycle({
    deprecatedAt: 'v1.141.0',
    summary: 'Create a partner',
    description: 'Create a new partner to share assets with.',
  })
  @Authenticated({ permission: Permission.PartnerCreate })
  createPartnerDeprecated(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<PartnerResponseDto> {
    return this.service.create(auth, { sharedWithId: id });
  }

  @Put(':id')
  @Authenticated({ permission: Permission.PartnerUpdate })
  @ApiOperation({
    summary: 'Update a partner',
    description: "Specify whether a partner's assets should appear in the user's timeline.",
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
  @ApiOperation({
    summary: 'Remove a partner',
    description: 'Stop sharing assets with a partner.',
  })
  removePartner(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(auth, id);
  }
}
