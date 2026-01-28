import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  AcceptInvitationDto,
  CreateInvitationDto,
  InvitationResponseDto,
} from 'src/dtos/invitation.dto';
import { UserAdminResponseDto } from 'src/dtos/user.dto';
import { ApiTag } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { InvitationService } from 'src/services/invitation.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.Invitations)
@Controller('invitations')
export class InvitationController {
  constructor(private service: InvitationService) {}

  @Post()
  @Authenticated({ admin: true })
  @Endpoint({
    summary: 'Create an invitation',
    description: 'Create an invitation to join the family photo sharing instance. Admin only.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  createInvitation(@Auth() auth: AuthDto, @Body() dto: CreateInvitationDto): Promise<InvitationResponseDto> {
    return this.service.create(auth.user.id, dto);
  }

  @Get()
  @Authenticated({ admin: true })
  @Endpoint({
    summary: 'List pending invitations',
    description: 'List all pending invitations created by the admin.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  listInvitations(@Auth() auth: AuthDto): Promise<InvitationResponseDto[]> {
    return this.service.list(auth.user.id);
  }

  @Delete(':id')
  @Authenticated({ admin: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Revoke an invitation',
    description: 'Revoke a pending invitation.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  revokeInvitation(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.revoke(auth.user.id, id);
  }

  @Get('validate')
  @ApiOkResponse({ type: InvitationResponseDto })
  @Endpoint({
    summary: 'Validate an invitation token',
    description: 'Check if an invitation token is valid and not expired. Public endpoint.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  validateInvitation(@Query('token') token: string): Promise<InvitationResponseDto | null> {
    return this.service.getByToken(token);
  }

  @Post('accept')
  @Endpoint({
    summary: 'Accept an invitation',
    description: 'Accept an invitation and create a new user account. Public endpoint.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  acceptInvitation(@Body() dto: AcceptInvitationDto): Promise<UserAdminResponseDto> {
    return this.service.accept(dto);
  }
}
