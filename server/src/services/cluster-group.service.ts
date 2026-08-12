import { BadRequestException, Injectable } from '@nestjs/common';
import { MaybeDuplicate } from 'src/dtos/activity.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  ClusterGroupRequestCreateDto,
  ClusterGroupRequestResponseDto,
  mapClusterGroupRequest,
} from 'src/dtos/cluster-group.dto';
import { mapUser, UserResponseDto } from 'src/dtos/user.dto';
import { Permission } from 'src/enum';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class ClusterGroupService extends BaseService {
  async getRequests(auth: AuthDto): Promise<ClusterGroupRequestResponseDto[]> {
    const requests = await this.clusterGroupRepository.getRequests(auth.user.id);
    return requests.map((request) => mapClusterGroupRequest(request));
  }

  async getRequestsForGroup(auth: AuthDto, clusterGroupId: string): Promise<ClusterGroupRequestResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.ClusterGroupRequestRead, ids: [clusterGroupId] });

    const requests = await this.clusterGroupRepository.getRequestsForGroup(clusterGroupId);
    return requests.map((request) => mapClusterGroupRequest(request));
  }

  async getUsers(auth: AuthDto, clusterGroupId: string): Promise<UserResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.ClusterGroupRead, ids: [clusterGroupId] });

    const users = await this.clusterGroupRepository.getUsers({ clusterGroupId, userId: auth.user.id });
    return users.map((user) => mapUser(user));
  }

  async createRequest(
    auth: AuthDto,
    clusterGroupId: string,
    { userId }: ClusterGroupRequestCreateDto,
  ): Promise<MaybeDuplicate<ClusterGroupRequestResponseDto>> {
    await this.requireAccess({ auth, permission: Permission.ClusterGroupRequestCreate, ids: [clusterGroupId] });

    if (userId === auth.user.id) {
      throw new BadRequestException('Cannot request to join your own cluster group');
    }

    const user = await this.userRepository.get(userId, {});
    if (!user) {
      throw new BadRequestException('Invalid user');
    }

    const created = await this.clusterGroupRepository.createRequest({ clusterGroupId, userId });
    const request = created ?? (await this.clusterGroupRepository.getRequestFor({ clusterGroupId, userId }));
    if (!request) {
      throw new BadRequestException('Request not found');
    }

    if (created) {
      await this.eventRepository.emit('ClusterGroupRequest', { clusterGroupId, userId, senderName: auth.user.name });
    }

    return { duplicate: !created, value: mapClusterGroupRequest(request) };
  }

  async acceptRequest(auth: AuthDto, id: string): Promise<void> {
    const request = await this.clusterGroupRepository.getRequest(id);
    if (!request || request.userId !== auth.user.id) {
      throw new BadRequestException('Request not found');
    }

    const clusterGroupId = await this.clusterGroupRepository.getForUser(auth.user.id);
    const hasOtherMembers = await this.clusterGroupRepository.hasOtherMembers({
      clusterGroupId,
      userId: auth.user.id,
    });
    if (hasOtherMembers) {
      throw new BadRequestException('Leave the current cluster group before joining another one');
    }

    await this.clusterGroupRepository.deleteRequest(request.id);
    await this.personRepository.reassignCluster({ userId: auth.user.id, newClusterId: request.clusterGroupId });
    await this.userRepository.update(auth.user.id, { clusterGroupId: request.clusterGroupId });
  }

  async deleteRequest(auth: AuthDto, id: string): Promise<void> {
    const request = await this.clusterGroupRepository.getRequest(id);
    if (!request) {
      throw new BadRequestException('Request not found');
    }

    // the user it was created for declines it, anyone in the cluster group revokes it
    if (request.userId !== auth.user.id) {
      await this.requireAccess({
        auth,
        permission: Permission.ClusterGroupRequestDelete,
        ids: [request.clusterGroupId],
      });
    }

    await this.clusterGroupRepository.deleteRequest(request.id);
  }

  async leave(auth: AuthDto, clusterGroupId: string): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.ClusterGroupLeave, ids: [clusterGroupId] });

    const hasOtherMembers = await this.clusterGroupRepository.hasOtherMembers({
      clusterGroupId,
      userId: auth.user.id,
    });
    if (!hasOtherMembers) {
      throw new BadRequestException('Cannot leave a cluster group without any other members');
    }

    const clusterGroup = await this.clusterGroupRepository.create();
    await this.personRepository.reassignCluster({ userId: auth.user.id, newClusterId: clusterGroup.id });
    await this.userRepository.update(auth.user.id, { clusterGroupId: clusterGroup.id });
  }
}
