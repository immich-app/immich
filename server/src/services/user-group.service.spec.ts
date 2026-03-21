import { NotFoundException } from '@nestjs/common';
import { UserAvatarColor } from 'src/enum';
import { UserGroupService } from 'src/services/user-group.service';
import { factory, newDate, newUuid } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';

const makeGroup = (overrides: Record<string, unknown> = {}) => ({
  id: newUuid(),
  name: 'Family A',
  color: null as string | null,
  origin: 'manual',
  createdById: newUuid(),
  createdAt: newDate(),
  updatedAt: newDate(),
  createId: newUuid(),
  updateId: newUuid(),
  ...overrides,
});

const makeMember = (overrides: Record<string, unknown> = {}) => ({
  groupId: newUuid(),
  userId: newUuid(),
  addedAt: newDate(),
  name: 'Test User',
  email: 'test@example.com',
  profileImagePath: '',
  profileChangedAt: newDate(),
  avatarColor: null,
  ...overrides,
});

describe(UserGroupService.name, () => {
  let sut: UserGroupService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(UserGroupService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should create a group with name and default null color', async () => {
      const auth = factory.auth();
      const group = makeGroup({ createdById: auth.user.id });
      mocks.userGroup.create.mockResolvedValue(group);
      mocks.userGroup.getMembers.mockResolvedValue([]);

      const result = await sut.create(auth, { name: 'Family A' });

      expect(result.id).toBe(group.id);
      expect(result.name).toBe('Family A');
      expect(result.members).toEqual([]);
      expect(mocks.userGroup.create).toHaveBeenCalledWith({
        name: 'Family A',
        color: null,
        createdById: auth.user.id,
      });
    });

    it('should pass color when provided', async () => {
      const auth = factory.auth();
      const group = makeGroup({ createdById: auth.user.id, color: 'blue' });
      mocks.userGroup.create.mockResolvedValue(group);
      mocks.userGroup.getMembers.mockResolvedValue([]);

      await sut.create(auth, { name: 'Family A', color: UserAvatarColor.Blue });

      expect(mocks.userGroup.create).toHaveBeenCalledWith({
        name: 'Family A',
        color: 'blue',
        createdById: auth.user.id,
      });
    });
  });

  describe('getAll', () => {
    it('should return groups with members for the current user', async () => {
      const auth = factory.auth();
      const group = makeGroup({ createdById: auth.user.id });
      const member = makeMember({ groupId: group.id });

      mocks.userGroup.getAllByUserId.mockResolvedValue([group]);
      mocks.userGroup.getMembers.mockResolvedValue([member]);

      const result = await sut.getAll(auth);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(group.id);
      expect(result[0].members).toHaveLength(1);
      expect(result[0].members[0].userId).toBe(member.userId);
      expect(mocks.userGroup.getAllByUserId).toHaveBeenCalledWith(auth.user.id);
    });

    it('should return empty array when user has no groups', async () => {
      const auth = factory.auth();
      mocks.userGroup.getAllByUserId.mockResolvedValue([]);

      const result = await sut.getAll(auth);
      expect(result).toEqual([]);
    });
  });

  describe('get', () => {
    it('should return group with members when user is owner', async () => {
      const auth = factory.auth();
      const group = makeGroup({ createdById: auth.user.id });
      mocks.userGroup.getById.mockResolvedValue(group);
      mocks.userGroup.getMembers.mockResolvedValue([]);

      const result = await sut.get(auth, group.id);
      expect(result.id).toBe(group.id);
    });

    it('should throw NotFoundException when group not found', async () => {
      const auth = factory.auth();
      mocks.userGroup.getById.mockResolvedValue(void 0);

      await expect(sut.get(auth, newUuid())).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw ForbiddenException when user is not the owner', async () => {
      const auth = factory.auth();
      const group = makeGroup({ createdById: newUuid() });
      mocks.userGroup.getById.mockResolvedValue(group);

      await expect(sut.get(auth, group.id)).rejects.toThrow('Not the owner of this group');
    });
  });

  describe('update', () => {
    it('should throw ForbiddenException when user is not the owner', async () => {
      const auth = factory.auth();
      const group = makeGroup({ createdById: newUuid() });
      mocks.userGroup.getById.mockResolvedValue(group);

      await expect(sut.update(auth, group.id, { name: 'New Name' })).rejects.toThrow('Not the owner of this group');
    });

    it('should update the group name', async () => {
      const auth = factory.auth();
      const group = makeGroup({ createdById: auth.user.id });
      const updated = { ...group, name: 'New Name' };
      mocks.userGroup.getById.mockResolvedValue(group);
      mocks.userGroup.update.mockResolvedValue(updated);
      mocks.userGroup.getMembers.mockResolvedValue([]);

      const result = await sut.update(auth, group.id, { name: 'New Name' });

      expect(result.name).toBe('New Name');
      expect(mocks.userGroup.update).toHaveBeenCalledWith(group.id, { name: 'New Name', color: undefined });
    });

    it('should update the group color', async () => {
      const auth = factory.auth();
      const group = makeGroup({ createdById: auth.user.id });
      const updated = { ...group, color: 'red' };
      mocks.userGroup.getById.mockResolvedValue(group);
      mocks.userGroup.update.mockResolvedValue(updated);
      mocks.userGroup.getMembers.mockResolvedValue([]);

      const result = await sut.update(auth, group.id, { color: UserAvatarColor.Red });
      expect(result.color).toBe('red');
    });
  });

  describe('remove', () => {
    it('should throw ForbiddenException when user is not the owner', async () => {
      const auth = factory.auth();
      const group = makeGroup({ createdById: newUuid() });
      mocks.userGroup.getById.mockResolvedValue(group);

      await expect(sut.remove(auth, group.id)).rejects.toThrow('Not the owner of this group');
    });

    it('should remove the group', async () => {
      const auth = factory.auth();
      const group = makeGroup({ createdById: auth.user.id });
      mocks.userGroup.getById.mockResolvedValue(group);
      mocks.userGroup.remove.mockResolvedValue();

      await sut.remove(auth, group.id);
      expect(mocks.userGroup.remove).toHaveBeenCalledWith(group.id);
    });
  });

  describe('setMembers', () => {
    it('should throw ForbiddenException when user is not the owner', async () => {
      const auth = factory.auth();
      const group = makeGroup({ createdById: newUuid() });
      mocks.userGroup.getById.mockResolvedValue(group);

      await expect(sut.setMembers(auth, group.id, { userIds: [newUuid()] })).rejects.toThrow(
        'Not the owner of this group',
      );
    });

    it('should replace members and return updated list', async () => {
      const auth = factory.auth();
      const group = makeGroup({ createdById: auth.user.id });
      const userId = newUuid();
      const member = makeMember({ groupId: group.id, userId });

      mocks.userGroup.getById.mockResolvedValue(group);
      mocks.userGroup.setMembers.mockResolvedValue();
      mocks.userGroup.getMembers.mockResolvedValue([member]);

      const result = await sut.setMembers(auth, group.id, { userIds: [userId] });

      expect(mocks.userGroup.setMembers).toHaveBeenCalledWith(group.id, [userId]);
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(userId);
    });

    it('should allow setting empty member list', async () => {
      const auth = factory.auth();
      const group = makeGroup({ createdById: auth.user.id });

      mocks.userGroup.getById.mockResolvedValue(group);
      mocks.userGroup.setMembers.mockResolvedValue();
      mocks.userGroup.getMembers.mockResolvedValue([]);

      const result = await sut.setMembers(auth, group.id, { userIds: [] });

      expect(mocks.userGroup.setMembers).toHaveBeenCalledWith(group.id, []);
      expect(result).toEqual([]);
    });

    it('should deduplicate user IDs', async () => {
      const auth = factory.auth();
      const group = makeGroup({ createdById: auth.user.id });
      const userId = newUuid();
      const member = makeMember({ groupId: group.id, userId });

      mocks.userGroup.getById.mockResolvedValue(group);
      mocks.userGroup.setMembers.mockResolvedValue();
      mocks.userGroup.getMembers.mockResolvedValue([member]);

      await sut.setMembers(auth, group.id, { userIds: [userId, userId, userId] });

      expect(mocks.userGroup.setMembers).toHaveBeenCalledWith(group.id, [userId]);
    });
  });
});
