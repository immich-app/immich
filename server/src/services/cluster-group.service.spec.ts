import { BadRequestException } from '@nestjs/common';
import { Resource } from 'src/resource-paths.js';
import { ClusterGroupService } from 'src/services/cluster-group.service.js';
import { AuthFactory } from 'test/factories/auth.factory.js';
import { ClusterGroupRequestFactory } from 'test/factories/cluster-group-request.factory.js';
import { ClusterGroupFactory } from 'test/factories/cluster-group.factory.js';
import { UserFactory } from 'test/factories/user.factory.js';
import { ServiceMocks, expectResourceEvents, newTestService } from 'test/utils.js';

describe(ClusterGroupService.name, () => {
  let sut: ClusterGroupService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(ClusterGroupService));
  });

  describe('createRequest', () => {
    it('should tell the cluster group and the requested user', async () => {
      const { id: clusterGroupId } = ClusterGroupFactory.create();
      const [owner, member] = [UserFactory.create({ clusterGroupId }), UserFactory.create({ clusterGroupId })];
      const requested = UserFactory.create();
      const request = ClusterGroupRequestFactory.create({ clusterGroupId, userId: requested.id });
      mocks.access.clusterGroup.checkOwnerAccess.mockResolvedValue(new Set([clusterGroupId]));
      mocks.user.get.mockResolvedValue(requested);
      mocks.clusterGroup.createRequest.mockResolvedValue({ ...request, isInserted: true });
      mocks.clusterGroup.getUsers.mockResolvedValue([owner, member]);
      mocks.clusterGroup.searchRequests.mockResolvedValue([request]);

      await sut.createRequest(AuthFactory.create(owner), clusterGroupId, { userId: requested.id });

      expectResourceEvents(
        mocks,
        {
          userIds: [owner.id, member.id, requested.id],
          changed: [Resource.clusterGroupRequestsForGroup({ id: clusterGroupId })],
        },
        { userIds: [requested.id], changed: [Resource.clusterGroupRequests()] },
      );
    });

    it('should not tell anyone about an existing request', async () => {
      const { id: clusterGroupId } = ClusterGroupFactory.create();
      const owner = UserFactory.create({ clusterGroupId });
      const requested = UserFactory.create();
      const request = ClusterGroupRequestFactory.create({ clusterGroupId, userId: requested.id });
      mocks.access.clusterGroup.checkOwnerAccess.mockResolvedValue(new Set([clusterGroupId]));
      mocks.user.get.mockResolvedValue(requested);
      mocks.clusterGroup.createRequest.mockResolvedValue({ ...request, isInserted: false });

      await sut.createRequest(AuthFactory.create(owner), clusterGroupId, { userId: requested.id });

      expect(mocks.resource.send).not.toHaveBeenCalled();
    });

    it('should not tell anyone when the user requests themselves', async () => {
      const { id: clusterGroupId } = ClusterGroupFactory.create();
      const owner = UserFactory.create({ clusterGroupId });
      mocks.access.clusterGroup.checkOwnerAccess.mockResolvedValue(new Set([clusterGroupId]));

      await expect(
        sut.createRequest(AuthFactory.create(owner), clusterGroupId, { userId: owner.id }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.resource.send).not.toHaveBeenCalled();
    });
  });

  describe('acceptRequest', () => {
    it('should tell the old group, the new group and the user', async () => {
      const [{ id: oldGroupId }, { id: newGroupId }] = [ClusterGroupFactory.create(), ClusterGroupFactory.create()];
      const user = UserFactory.create({ clusterGroupId: oldGroupId });
      const oldMember = UserFactory.create({ clusterGroupId: oldGroupId });
      const newMember = UserFactory.create({ clusterGroupId: newGroupId });
      const oldGroupRequest = ClusterGroupRequestFactory.create({ clusterGroupId: oldGroupId });
      const request = ClusterGroupRequestFactory.create({ clusterGroupId: newGroupId, userId: user.id });
      const members = new Map([
        [oldGroupId, [user, oldMember]],
        [newGroupId, [newMember]],
      ]);
      const requests = new Map([
        [oldGroupId, [oldGroupRequest]],
        [newGroupId, [request]],
      ]);
      mocks.access.clusterGroupRequest.checkOwnerAccess.mockResolvedValue(new Set([request.id]));
      mocks.clusterGroup.getRequest.mockResolvedValue(request);
      mocks.user.get.mockResolvedValue(user);
      mocks.clusterGroup.getUsers.mockImplementation(({ clusterGroupId }) =>
        Promise.resolve(members.get(clusterGroupId)!),
      );
      mocks.clusterGroup.searchRequests.mockImplementation(({ clusterGroupId } = {}) =>
        Promise.resolve(requests.get(clusterGroupId!)!),
      );
      mocks.clusterGroup.deleteRequest.mockResolvedValue();

      await sut.acceptRequest(AuthFactory.create(user), request.id);

      expectResourceEvents(
        mocks,
        {
          userIds: [user.id, oldMember.id, oldGroupRequest.userId],
          changed: [Resource.clusterGroup({ id: oldGroupId })],
        },
        { userIds: [newMember.id, user.id], changed: [Resource.clusterGroup({ id: newGroupId })] },
        { userIds: [user.id, oldMember.id], changed: [Resource.people()] },
        { userIds: [user.id], changed: [Resource.clusterGroupRequests(), Resource.myUser()] },
      );
    });

    it('should not tell anyone without access to the request', async () => {
      await expect(
        sut.acceptRequest(AuthFactory.create(), ClusterGroupRequestFactory.create().id),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.resource.send).not.toHaveBeenCalled();
    });
  });

  describe('deleteRequest', () => {
    it('should tell the cluster group and the requested user', async () => {
      const { id: clusterGroupId } = ClusterGroupFactory.create();
      const member = UserFactory.create({ clusterGroupId });
      const requested = UserFactory.create();
      const request = ClusterGroupRequestFactory.create({ clusterGroupId, userId: requested.id });
      const otherRequest = ClusterGroupRequestFactory.create({ clusterGroupId });
      mocks.access.clusterGroupRequest.checkOwnerAccess.mockResolvedValue(new Set([request.id]));
      mocks.clusterGroup.getRequest.mockResolvedValue(request);
      mocks.clusterGroup.getUsers.mockResolvedValue([member]);
      mocks.clusterGroup.searchRequests.mockResolvedValue([request, otherRequest]);
      mocks.clusterGroup.deleteRequest.mockResolvedValue();

      await sut.deleteRequest(AuthFactory.create(requested), request.id);

      expectResourceEvents(
        mocks,
        {
          userIds: [member.id, requested.id, otherRequest.userId],
          changed: [Resource.clusterGroupRequestsForGroup({ id: clusterGroupId })],
        },
        { userIds: [requested.id], changed: [Resource.clusterGroupRequests()] },
      );
    });

    it('should not tell anyone without access to the request', async () => {
      await expect(
        sut.deleteRequest(AuthFactory.create(), ClusterGroupRequestFactory.create().id),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.resource.send).not.toHaveBeenCalled();
    });
  });

  describe('leave', () => {
    it('should tell the old group and the user', async () => {
      const { id: clusterGroupId } = ClusterGroupFactory.create();
      const [user, member] = [UserFactory.create({ clusterGroupId }), UserFactory.create({ clusterGroupId })];
      const request = ClusterGroupRequestFactory.create({ clusterGroupId });
      mocks.access.clusterGroup.checkOwnerAccess.mockResolvedValue(new Set([clusterGroupId]));
      mocks.clusterGroup.hasOtherMembers.mockResolvedValue(true);
      mocks.clusterGroup.getUsers.mockResolvedValue([user, member]);
      mocks.clusterGroup.searchRequests.mockResolvedValue([request]);

      await sut.leave(AuthFactory.create(user), clusterGroupId);

      expectResourceEvents(
        mocks,
        { userIds: [user.id, member.id, request.userId], changed: [Resource.clusterGroup({ id: clusterGroupId })] },
        { userIds: [user.id, member.id], changed: [Resource.people()] },
        { userIds: [user.id], changed: [Resource.myUser()] },
      );
    });

    it('should not tell anyone when the last member tries to leave', async () => {
      const { id: clusterGroupId } = ClusterGroupFactory.create();
      const user = UserFactory.create({ clusterGroupId });
      mocks.access.clusterGroup.checkOwnerAccess.mockResolvedValue(new Set([clusterGroupId]));
      mocks.clusterGroup.hasOtherMembers.mockResolvedValue(false);

      await expect(sut.leave(AuthFactory.create(user), clusterGroupId)).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.resource.send).not.toHaveBeenCalled();
    });
  });
});
