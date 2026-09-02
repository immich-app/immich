import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { ClusterGroupRequestCreateDto, ClusterGroupRequestResponseDto } from 'src/dtos/cluster-group.dto';
import { UserResponseDto } from 'src/dtos/user.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { ClusterGroupService } from 'src/services/cluster-group.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.ClusterGroups)
@Controller('cluster-groups')
export class ClusterGroupController {
  constructor(private service: ClusterGroupService) {}

  @Get('requests')
  @Authenticated({ permission: Permission.ClusterGroupRequestRead })
  @Endpoint({
    summary: 'Retrieve cluster group requests',
    description: 'Retrieve the pending requests for the current user to join a cluster group.',
    history: new HistoryBuilder().added('v3.2.0'),
  })
  getClusterGroupRequests(@Auth() auth: AuthDto): Promise<ClusterGroupRequestResponseDto[]> {
    return this.service.getRequests(auth);
  }

  @Post('requests/:id/accept')
  @Authenticated({ permission: Permission.ClusterGroupRequestCreate })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Accept a cluster group request',
    description: 'Join the cluster group the request was created for.',
    history: new HistoryBuilder().added('v3.2.0'),
  })
  acceptClusterGroupRequest(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.acceptRequest(auth, id);
  }

  @Delete('requests/:id')
  @Authenticated({ permission: Permission.ClusterGroupRequestDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Decline a cluster group request',
    description: 'Delete a pending request to join a cluster group.',
    history: new HistoryBuilder().added('v3.2.0'),
  })
  deleteClusterGroupRequest(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.deleteRequest(auth, id);
  }

  @Get(':id/requests')
  @Authenticated({ permission: Permission.ClusterGroupRequestRead })
  @Endpoint({
    summary: 'Retrieve the requests sent by a cluster group',
    description: 'Retrieve the pending requests for other users to join the cluster group.',
    history: new HistoryBuilder().added('v3.2.0'),
  })
  getClusterGroupRequestsForGroup(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
  ): Promise<ClusterGroupRequestResponseDto[]> {
    return this.service.getRequestsForGroup(auth, id);
  }

  @Get(':id/users')
  @Authenticated({ permission: Permission.ClusterGroupRead })
  @Endpoint({
    summary: 'Retrieve the users of a cluster group',
    description: 'Retrieve the users that are a member of the cluster group.',
    history: new HistoryBuilder().added('v3.2.0'),
  })
  getClusterGroupUsers(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<UserResponseDto[]> {
    return this.service.getUsers(auth, id);
  }

  @Put(':id/requests')
  @Authenticated({ permission: Permission.ClusterGroupRequestCreate })
  @Endpoint({
    summary: 'Create a cluster group request',
    description: 'Ask another user to join the cluster group of the current user.',
    history: new HistoryBuilder().added('v3.2.0'),
  })
  async createClusterGroupRequest(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: ClusterGroupRequestCreateDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ClusterGroupRequestResponseDto> {
    const { duplicate, value } = await this.service.createRequest(auth, id, dto);
    res.status(duplicate ? HttpStatus.OK : HttpStatus.CREATED);
    return value;
  }

  @Post(':id/regenerate-people')
  @Authenticated({ permission: Permission.ClusterGroupRead })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Regenerate people of users in cluster group',
    description: 'Forcefully re-run facial recognition for all faces of users in this group.',
    history: new HistoryBuilder().added('v3.2.0'),
  })
  clusterGroupRegeneratePeople(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.regeneratePeople(auth, id);
  }

  @Post(':id/leave')
  @Authenticated({ permission: Permission.ClusterGroupLeave })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Leave a cluster group',
    description: 'Move the current user into a new cluster group of their own.',
    history: new HistoryBuilder().added('v3.2.0'),
  })
  leaveClusterGroup(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.leave(auth, id);
  }
}
