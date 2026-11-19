import { BadRequestException, Injectable } from '@nestjs/common';
import { MaybeDuplicate } from 'src/dtos/activity.dto.js';
import { AuthDto } from 'src/dtos/auth.dto.js';
import {
  ClusterGroupRequestCreateDto,
  ClusterGroupRequestResponseDto,
  mapClusterGroupRequest,
} from 'src/dtos/cluster-group.dto.js';
import { UserResponseDto, mapUser } from 'src/dtos/user.dto.js';
import { JobName, Permission } from 'src/enum.js';
import { Resource } from 'src/resource-paths.js';
import { BaseService } from 'src/services/base.service.js';
import { findOrFail } from 'src/utils/misc.js';

@Injectable()
export class ClusterGroupService extends BaseService {
  async getRequests(auth: AuthDto): Promise<ClusterGroupRequestResponseDto[]> {
    const requests = await this.clusterGroupRepository.searchRequests({ userId: auth.user.id });
    return requests.map((request) => mapClusterGroupRequest(request));
  }

  async getRequestsForGroup(auth: AuthDto, clusterGroupId: string): Promise<ClusterGroupRequestResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.ClusterGroupRead, ids: [clusterGroupId] });

    const requests = await this.clusterGroupRepository.searchRequests({ clusterGroupId });
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

    await findOrFail(() => this.userRepository.get(userId, {}), 'User');

    const request = await findOrFail(
      () => this.clusterGroupRepository.createRequest({ clusterGroupId, userId }),
      'Request',
    );

    if (request.isInserted) {
      const { readerIds } = await this.getAudience(auth, clusterGroupId);
      this.resourceRepository.send({
        userIds: readerIds,
        changed: [Resource.clusterGroupRequestsForGroup({ id: clusterGroupId })],
      });
      this.resourceRepository.send({ userIds: [userId], changed: [Resource.clusterGroupRequests()] });
      await this.eventRepository.emit('ClusterGroupRequest', { clusterGroupId, userId, senderName: auth.user.name });
    }

    return { duplicate: !request.isInserted, value: mapClusterGroupRequest(request) };
  }

  async acceptRequest(auth: AuthDto, id: string): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.ClusterGroupRequestRead, ids: [id] });

    const request = await findOrFail(() => this.clusterGroupRepository.getRequest(id), 'Request');
    const { clusterGroupId: oldClusterGroupId } = await findOrFail(
      () => this.userRepository.get(auth.user.id, {}),
      'User',
    );
    const oldGroup = await this.getAudience(auth, oldClusterGroupId);
    const newGroup = await this.getAudience(auth, request.clusterGroupId);

    await this.personRepository.reassignCluster({ userId: auth.user.id, newClusterId: request.clusterGroupId });
    await this.userRepository.update(auth.user.id, { clusterGroupId: request.clusterGroupId });
    await this.clusterGroupRepository.deleteRequest(request.id);

    this.resourceRepository.send({
      userIds: oldGroup.readerIds,
      changed: [Resource.clusterGroup({ id: oldClusterGroupId })],
    });
    this.resourceRepository.send({ userIds: oldGroup.memberIds, changed: [Resource.people()] });
    this.resourceRepository.send({
      userIds: newGroup.readerIds,
      changed: [Resource.clusterGroup({ id: request.clusterGroupId })],
    });
    this.resourceRepository.send({
      userIds: [auth.user.id],
      changed: [Resource.clusterGroupRequests(), Resource.myUser()],
    });
  }

  async deleteRequest(auth: AuthDto, id: string): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.ClusterGroupRequestDelete, ids: [id] });
    const request = await findOrFail(() => this.clusterGroupRepository.getRequest(id), 'Request');
    const { readerIds } = await this.getAudience(auth, request.clusterGroupId);

    await this.clusterGroupRepository.deleteRequest(id);
    this.resourceRepository.send({
      userIds: readerIds,
      changed: [Resource.clusterGroupRequestsForGroup({ id: request.clusterGroupId })],
    });
    this.resourceRepository.send({ userIds: [request.userId], changed: [Resource.clusterGroupRequests()] });
  }

  async regeneratePeople(auth: AuthDto, id: string) {
    await this.requireAccess({ auth, permission: Permission.ClusterGroupAdmin, ids: [id] });

    await this.jobRepository.queue({
      name: JobName.FacialRecognitionQueueAll,
      data: { clusterGroupId: id, force: true },
    });
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

    const oldGroup = await this.getAudience(auth, clusterGroupId);
    const clusterGroup = await this.clusterGroupRepository.create();
    await this.personRepository.reassignCluster({ userId: auth.user.id, newClusterId: clusterGroup.id });
    await this.userRepository.update(auth.user.id, { clusterGroupId: clusterGroup.id });

    this.resourceRepository.send({
      userIds: oldGroup.readerIds,
      changed: [Resource.clusterGroup({ id: clusterGroupId })],
    });
    this.resourceRepository.send({ userIds: oldGroup.memberIds, changed: [Resource.people()] });
    this.resourceRepository.send({ userIds: [auth.user.id], changed: [Resource.myUser()] });
  }

  private async getAudience(auth: AuthDto, clusterGroupId: string) {
    const [members, requests] = await Promise.all([
      this.clusterGroupRepository.getUsers({ clusterGroupId, userId: auth.user.id }),
      this.clusterGroupRepository.searchRequests({ clusterGroupId }),
    ]);
    const memberIds = members.map(({ id }) => id);
    return { memberIds, readerIds: [...memberIds, ...requests.map(({ userId }) => userId)] };
  }
}
