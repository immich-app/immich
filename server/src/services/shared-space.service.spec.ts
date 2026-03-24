import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { MapMarkerResponseDto } from 'src/dtos/map.dto';
import {
  JobName,
  JobStatus,
  NotificationLevel,
  NotificationType,
  SharedSpaceActivityType,
  SharedSpaceRole,
  UserAvatarColor,
} from 'src/enum';
import { SharedSpaceService } from 'src/services/shared-space.service';
import { factory, newDate, newUuid } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';

/** Helper to build a joined member result (member + user fields from the repo join). */
const makeMemberResult = (overrides: any = {}) => ({
  ...factory.sharedSpaceMember(),
  name: 'Test User',
  email: 'test@immich.cloud',
  profileImagePath: '',
  profileChangedAt: newDate(),
  avatarColor: null as UserAvatarColor | null,
  showInTimeline: true,
  ...overrides,
});

describe(SharedSpaceService.name, () => {
  let sut: SharedSpaceService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(SharedSpaceService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should create space and add creator as owner', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace({ createdById: auth.user.id });

      mocks.sharedSpace.create.mockResolvedValue(space);
      mocks.sharedSpace.addMember.mockResolvedValue(
        factory.sharedSpaceMember({
          spaceId: space.id,
          userId: auth.user.id,
          role: SharedSpaceRole.Owner,
        }),
      );

      const result = await sut.create(auth, { name: 'Test Space' });

      expect(result.id).toBe(space.id);
      expect(result.name).toBe('Test Space');
      expect(result.createdById).toBe(auth.user.id);
      expect(result.faceRecognitionEnabled).toBe(true);

      expect(mocks.sharedSpace.create).toHaveBeenCalledWith({
        name: 'Test Space',
        description: null,
        color: 'primary',
        createdById: auth.user.id,
      });

      expect(mocks.sharedSpace.addMember).toHaveBeenCalledWith({
        spaceId: space.id,
        userId: auth.user.id,
        role: SharedSpaceRole.Owner,
      });
    });

    it('should pass description when provided', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace({ createdById: auth.user.id, description: 'A cool space' });

      mocks.sharedSpace.create.mockResolvedValue(space);
      mocks.sharedSpace.addMember.mockResolvedValue(
        factory.sharedSpaceMember({
          spaceId: space.id,
          userId: auth.user.id,
          role: SharedSpaceRole.Owner,
        }),
      );

      const result = await sut.create(auth, { name: 'Test Space', description: 'A cool space' });

      expect(result.description).toBe('A cool space');
      expect(mocks.sharedSpace.create).toHaveBeenCalledWith({
        name: 'Test Space',
        description: 'A cool space',
        color: 'primary',
        createdById: auth.user.id,
      });
    });

    it('should pass color when provided', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace({ createdById: auth.user.id, color: 'blue' });

      mocks.sharedSpace.create.mockResolvedValue(space);
      mocks.sharedSpace.addMember.mockResolvedValue(
        factory.sharedSpaceMember({
          spaceId: space.id,
          userId: auth.user.id,
          role: SharedSpaceRole.Owner,
        }),
      );

      const result = await sut.create(auth, { name: 'Test Space', color: UserAvatarColor.Blue });

      expect(result.color).toBe('blue');
      expect(mocks.sharedSpace.create).toHaveBeenCalledWith({
        name: 'Test Space',
        description: null,
        color: UserAvatarColor.Blue,
        createdById: auth.user.id,
      });
    });

    it('should default color to primary when not provided', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace({ createdById: auth.user.id, color: 'primary' });

      mocks.sharedSpace.create.mockResolvedValue(space);
      mocks.sharedSpace.addMember.mockResolvedValue(
        factory.sharedSpaceMember({
          spaceId: space.id,
          userId: auth.user.id,
          role: SharedSpaceRole.Owner,
        }),
      );

      const result = await sut.create(auth, { name: 'Test Space' });

      expect(result.color).toBe('primary');
      expect(mocks.sharedSpace.create).toHaveBeenCalledWith({
        name: 'Test Space',
        description: null,
        color: 'primary',
        createdById: auth.user.id,
      });
    });
  });

  describe('getAll', () => {
    it('should return all spaces for user', async () => {
      const auth = factory.auth();
      const space1 = factory.sharedSpace({ name: 'Space 1' });
      const space2 = factory.sharedSpace({ name: 'Space 2' });

      mocks.sharedSpace.getAllByUserId.mockResolvedValue([space1, space2]);
      mocks.sharedSpace.getMembers.mockResolvedValue([]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(0);
      mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ lastViewedAt: null }));

      const result = await sut.getAll(auth);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Space 1');
      expect(result[0].faceRecognitionEnabled).toBe(true);
      expect(result[1].name).toBe('Space 2');
      expect(mocks.sharedSpace.getAllByUserId).toHaveBeenCalledWith(auth.user.id);
    });

    it('should include thumbnailAssetId in response', async () => {
      const auth = factory.auth();
      const thumbnailAssetId = newUuid();
      const space = factory.sharedSpace({ name: 'Space With Thumbnail', thumbnailAssetId });

      mocks.sharedSpace.getAllByUserId.mockResolvedValue([space]);
      mocks.sharedSpace.getMembers.mockResolvedValue([]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(0);
      mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ lastViewedAt: null }));

      const result = await sut.getAll(auth);

      expect(result).toHaveLength(1);
      expect(result[0].thumbnailAssetId).toBe(thumbnailAssetId);
    });

    it('should include member info and counts for each space', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace({ name: 'Space 1' });
      const member1 = makeMemberResult({ spaceId: space.id, name: 'User 1', role: SharedSpaceRole.Owner });
      const member2 = makeMemberResult({ spaceId: space.id, name: 'User 2', role: SharedSpaceRole.Viewer });

      mocks.sharedSpace.getAllByUserId.mockResolvedValue([space]);
      mocks.sharedSpace.getMembers.mockResolvedValue([member1, member2]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(10);
      mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ lastViewedAt: null }));

      const result = await sut.getAll(auth);

      expect(result).toHaveLength(1);
      expect(result[0].memberCount).toBe(2);
      expect(result[0].assetCount).toBe(10);
      expect(result[0].members).toHaveLength(2);
      expect(result[0].members![0].name).toBe('User 1');
      expect(result[0].members![1].name).toBe('User 2');
    });

    it('should include color in response', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace({ name: 'Blue Space', color: 'blue' });

      mocks.sharedSpace.getAllByUserId.mockResolvedValue([space]);
      mocks.sharedSpace.getMembers.mockResolvedValue([]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(0);
      mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ lastViewedAt: null }));

      const result = await sut.getAll(auth);

      expect(result[0].color).toBe('blue');
    });

    it('should return null color when space has no color set', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace({ color: null });

      mocks.sharedSpace.getAllByUserId.mockResolvedValue([space]);
      mocks.sharedSpace.getMembers.mockResolvedValue([]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(0);
      mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ lastViewedAt: null }));

      const result = await sut.getAll(auth);

      expect(result[0].color).toBeNull();
    });

    it('should include recentAssetIds and thumbhashes', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace();
      const recentAssets = [
        { id: newUuid(), thumbhash: Buffer.from('abc123') },
        { id: newUuid(), thumbhash: Buffer.from('def456') },
      ];

      mocks.sharedSpace.getAllByUserId.mockResolvedValue([space]);
      mocks.sharedSpace.getMembers.mockResolvedValue([]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(5);
      mocks.sharedSpace.getRecentAssets.mockResolvedValue(recentAssets);
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ lastViewedAt: null }));

      const result = await sut.getAll(auth);

      expect(result[0].recentAssetIds).toEqual([recentAssets[0].id, recentAssets[1].id]);
      expect(result[0].recentAssetThumbhashes).toEqual(['YWJjMTIz', 'ZGVmNDU2']);
    });

    it('should return empty arrays for spaces with no assets', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace();

      mocks.sharedSpace.getAllByUserId.mockResolvedValue([space]);
      mocks.sharedSpace.getMembers.mockResolvedValue([]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(0);
      mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ lastViewedAt: null }));

      const result = await sut.getAll(auth);

      expect(result[0].recentAssetIds).toEqual([]);
      expect(result[0].recentAssetThumbhashes).toEqual([]);
    });

    it('should include lastActivityAt in response', async () => {
      const auth = factory.auth();
      const lastActivity = new Date('2026-03-05T12:00:00.000Z');
      const space = factory.sharedSpace({ lastActivityAt: lastActivity });

      mocks.sharedSpace.getAllByUserId.mockResolvedValue([space]);
      mocks.sharedSpace.getMembers.mockResolvedValue([]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(0);
      mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ lastViewedAt: null }));

      const result = await sut.getAll(auth);

      expect(result[0].lastActivityAt).toBe(lastActivity.toISOString());
    });

    it('should return newAssetCount when member has lastViewedAt', async () => {
      const auth = factory.auth();
      const lastViewed = new Date('2024-01-01');
      const space = factory.sharedSpace();
      mocks.sharedSpace.getAllByUserId.mockResolvedValue([space]);
      mocks.sharedSpace.getMembers.mockResolvedValue([]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(5);
      mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);
      mocks.sharedSpace.getMember.mockResolvedValue(
        makeMemberResult({ role: SharedSpaceRole.Owner, lastViewedAt: lastViewed }),
      );
      mocks.sharedSpace.getNewAssetCount.mockResolvedValue(3);
      mocks.sharedSpace.getLastContributor.mockResolvedValue({ id: 'user-2', name: 'Marie' });

      const result = await sut.getAll(auth);

      expect(result[0].newAssetCount).toBe(3);
      expect(result[0].lastContributor).toEqual({ id: 'user-2', name: 'Marie' });
    });

    it('should return newAssetCount equal to assetCount when lastViewedAt is null', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace();
      mocks.sharedSpace.getAllByUserId.mockResolvedValue([space]);
      mocks.sharedSpace.getMembers.mockResolvedValue([]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(5);
      mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);
      mocks.sharedSpace.getMember.mockResolvedValue(
        makeMemberResult({ role: SharedSpaceRole.Owner, lastViewedAt: null }),
      );

      const result = await sut.getAll(auth);

      expect(result[0].newAssetCount).toBe(5);
      expect(result[0].lastContributor).toBeNull();
    });

    it('should return newAssetCount 0 when no new assets since lastViewedAt', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace();
      mocks.sharedSpace.getAllByUserId.mockResolvedValue([space]);
      mocks.sharedSpace.getMembers.mockResolvedValue([]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(5);
      mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);
      mocks.sharedSpace.getMember.mockResolvedValue(
        makeMemberResult({ role: SharedSpaceRole.Owner, lastViewedAt: new Date() }),
      );
      mocks.sharedSpace.getNewAssetCount.mockResolvedValue(0);

      const result = await sut.getAll(auth);

      expect(result[0].newAssetCount).toBe(0);
      expect(result[0].lastContributor).toBeNull();
    });
  });

  describe('get', () => {
    it('should return space with counts when user is member', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace();
      const member = makeMemberResult({
        spaceId: space.id,
        userId: auth.user.id,
        role: SharedSpaceRole.Viewer,
      });

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMembers.mockResolvedValue([member, makeMemberResult()]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(5);

      mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);

      const result = await sut.get(auth, space.id);

      expect(result.id).toBe(space.id);
      expect(result.memberCount).toBe(2);
      expect(result.assetCount).toBe(5);
      expect(result.faceRecognitionEnabled).toBe(true);
      expect(result.petsEnabled).toBe(true);
    });

    it('should return faceRecognitionEnabled=false when disabled', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace({ faceRecognitionEnabled: false });
      const member = makeMemberResult({
        spaceId: space.id,
        userId: auth.user.id,
        role: SharedSpaceRole.Viewer,
      });

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMembers.mockResolvedValue([member]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(0);
      mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);

      const result = await sut.get(auth, space.id);

      expect(result.faceRecognitionEnabled).toBe(false);
    });

    it('should return thumbnailAssetId when set', async () => {
      const auth = factory.auth();
      const thumbnailAssetId = newUuid();
      const space = factory.sharedSpace({ thumbnailAssetId });
      const member = makeMemberResult({
        spaceId: space.id,
        userId: auth.user.id,
        role: SharedSpaceRole.Viewer,
      });

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMembers.mockResolvedValue([member]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(3);
      mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);

      const result = await sut.get(auth, space.id);

      expect(result.thumbnailAssetId).toBe(thumbnailAssetId);
    });

    it('should return null thumbnailAssetId when not explicitly set', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace({ thumbnailAssetId: null });
      const member = makeMemberResult({
        spaceId: space.id,
        userId: auth.user.id,
        role: SharedSpaceRole.Viewer,
      });

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMembers.mockResolvedValue([member]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(5);
      mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);

      const result = await sut.get(auth, space.id);

      expect(result.thumbnailAssetId).toBeNull();
    });

    it('should clear thumbnailAssetId when the cover asset has been deleted', async () => {
      const auth = factory.auth();
      const deletedAssetId = newUuid();
      const space = factory.sharedSpace({ thumbnailAssetId: deletedAssetId });
      const member = makeMemberResult({
        spaceId: space.id,
        userId: auth.user.id,
        role: SharedSpaceRole.Viewer,
      });

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMembers.mockResolvedValue([member]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(0);
      mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);
      mocks.sharedSpace.update.mockResolvedValue(factory.sharedSpace({ id: space.id, thumbnailAssetId: null }));

      const result = await sut.get(auth, space.id);

      expect(result.thumbnailAssetId).toBeNull();
      expect(mocks.sharedSpace.update).toHaveBeenCalledWith(space.id, { thumbnailAssetId: null });
    });

    it('should clear thumbnailAssetId when the cover asset was deleted but other assets remain', async () => {
      const auth = factory.auth();
      const deletedAssetId = newUuid();
      const activeAssetId = newUuid();
      const space = factory.sharedSpace({ thumbnailAssetId: deletedAssetId });
      const member = makeMemberResult({
        spaceId: space.id,
        userId: auth.user.id,
        role: SharedSpaceRole.Viewer,
      });

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMembers.mockResolvedValue([member]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(1);
      mocks.sharedSpace.getRecentAssets.mockResolvedValue([{ id: activeAssetId, thumbhash: null }]);
      mocks.sharedSpace.update.mockResolvedValue(factory.sharedSpace({ id: space.id, thumbnailAssetId: null }));

      const result = await sut.get(auth, space.id);

      expect(result.thumbnailAssetId).toBeNull();
      expect(mocks.sharedSpace.update).toHaveBeenCalledWith(space.id, { thumbnailAssetId: null });
    });

    it('should keep thumbnailAssetId when it is still an active asset', async () => {
      const auth = factory.auth();
      const coverAssetId = newUuid();
      const space = factory.sharedSpace({ thumbnailAssetId: coverAssetId });
      const member = makeMemberResult({
        spaceId: space.id,
        userId: auth.user.id,
        role: SharedSpaceRole.Viewer,
      });

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMembers.mockResolvedValue([member]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(3);
      mocks.sharedSpace.getRecentAssets.mockResolvedValue([
        { id: coverAssetId, thumbhash: null },
        { id: newUuid(), thumbhash: null },
        { id: newUuid(), thumbhash: null },
      ]);

      const result = await sut.get(auth, space.id);

      expect(result.thumbnailAssetId).toBe(coverAssetId);
      expect(mocks.sharedSpace.update).not.toHaveBeenCalled();
    });

    it('should return assetCount of 0 when all assets are deleted', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace();
      const member = makeMemberResult({
        spaceId: space.id,
        userId: auth.user.id,
        role: SharedSpaceRole.Viewer,
      });

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMembers.mockResolvedValue([member]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(0);
      mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);

      const result = await sut.get(auth, space.id);

      expect(result.assetCount).toBe(0);
    });

    it('should return decremented assetCount after asset deletion', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace();
      const member = makeMemberResult({
        spaceId: space.id,
        userId: auth.user.id,
        role: SharedSpaceRole.Viewer,
      });

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMembers.mockResolvedValue([member]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(2);
      mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);

      const result = await sut.get(auth, space.id);
      expect(result.assetCount).toBe(2);

      // Simulate deleted asset — repository now returns lower count
      mocks.sharedSpace.getAssetCount.mockResolvedValue(1);
      const result2 = await sut.get(auth, space.id);
      expect(result2.assetCount).toBe(1);
    });

    it('should include recentAssetIds and thumbhashes', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace();
      const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Viewer });
      const recentAssets = [
        { id: newUuid(), thumbhash: Buffer.from('thumb1') },
        { id: newUuid(), thumbhash: null },
        { id: newUuid(), thumbhash: Buffer.from('thumb3') },
      ];

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMembers.mockResolvedValue([member]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(10);

      mocks.sharedSpace.getRecentAssets.mockResolvedValue(recentAssets);

      const result = await sut.get(auth, space.id);

      expect(result.recentAssetIds).toEqual([recentAssets[0].id, recentAssets[1].id, recentAssets[2].id]);
      expect(result.recentAssetThumbhashes).toEqual(['dGh1bWIx', null, 'dGh1bWIz']);
    });

    it('should include lastActivityAt in response', async () => {
      const auth = factory.auth();
      const lastActivity = new Date('2026-03-01T00:00:00.000Z');
      const space = factory.sharedSpace({ lastActivityAt: lastActivity });
      const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Viewer });

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMembers.mockResolvedValue([member]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(0);

      mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);

      const result = await sut.get(auth, space.id);

      expect(result.lastActivityAt).toBe(lastActivity.toISOString());
    });

    it('should throw when user is not member', async () => {
      const auth = factory.auth();

      mocks.sharedSpace.getMember.mockResolvedValue(void 0);

      await expect(sut.get(auth, newUuid())).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should include color in response', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace({ color: 'green' });
      const member = makeMemberResult({
        spaceId: space.id,
        userId: auth.user.id,
        role: SharedSpaceRole.Viewer,
      });

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMembers.mockResolvedValue([member]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(0);

      mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);

      const result = await sut.get(auth, space.id);

      expect(result.color).toBe('green');
    });

    it('should include lastViewedAt in response', async () => {
      const space = factory.sharedSpace();
      const viewedAt = new Date('2026-03-09T10:00:00Z');
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ lastViewedAt: viewedAt }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMembers.mockResolvedValue([]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(0);
      mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);
      mocks.sharedSpace.getNewAssetCount.mockResolvedValue(3);

      const result = await sut.get(factory.auth(), space.id);

      expect(result.lastViewedAt).toBe('2026-03-09T10:00:00.000Z');
      expect(result.newAssetCount).toBe(3);
    });
  });

  describe('update', () => {
    it('should update when user is owner', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace();
      const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Owner });
      const updatedSpace = { ...space, name: 'Updated Name' };

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.update.mockResolvedValue(updatedSpace);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      const result = await sut.update(auth, space.id, { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect(mocks.sharedSpace.update).toHaveBeenCalledWith(space.id, {
        name: 'Updated Name',
        description: undefined,
        thumbnailAssetId: undefined,
        thumbnailCropY: undefined,
        color: undefined,
        faceRecognitionEnabled: undefined,
        petsEnabled: undefined,
      });
    });

    it('should update thumbnailAssetId when owner', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace();
      const thumbnailAssetId = newUuid();
      const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Owner });
      const updatedSpace = { ...space, thumbnailAssetId };

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.isAssetInSpace.mockResolvedValue(true);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.update.mockResolvedValue(updatedSpace);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      const result = await sut.update(auth, space.id, { thumbnailAssetId });

      expect(result.thumbnailAssetId).toBe(thumbnailAssetId);
      expect(mocks.sharedSpace.update).toHaveBeenCalledWith(space.id, {
        name: undefined,
        description: undefined,
        thumbnailAssetId,
        thumbnailCropY: null,
        color: undefined,
        faceRecognitionEnabled: undefined,
        petsEnabled: undefined,
      });
    });

    it('should clear thumbnailAssetId when set to null', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace({ thumbnailAssetId: newUuid() });
      const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Owner });
      const updatedSpace = { ...space, thumbnailAssetId: null };

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.update.mockResolvedValue(updatedSpace);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      const result = await sut.update(auth, space.id, { thumbnailAssetId: null });

      expect(result.thumbnailAssetId).toBeNull();
      expect(mocks.sharedSpace.update).toHaveBeenCalledWith(space.id, {
        name: undefined,
        description: undefined,
        thumbnailAssetId: null,
        thumbnailCropY: null,
        color: undefined,
        faceRecognitionEnabled: undefined,
        petsEnabled: undefined,
      });
    });

    it('should allow editor to update thumbnailAssetId', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace();
      const thumbnailAssetId = newUuid();
      const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Editor });

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.isAssetInSpace.mockResolvedValue(true);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.update.mockResolvedValue({ ...space, thumbnailAssetId });
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      const result = await sut.update(auth, space.id, { thumbnailAssetId });

      expect(result.thumbnailAssetId).toBe(thumbnailAssetId);
    });

    it('should reject thumbnailAssetId that is not in the space', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace();
      const foreignAssetId = newUuid();
      const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Editor });

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.isAssetInSpace.mockResolvedValue(false);

      await expect(sut.update(auth, space.id, { thumbnailAssetId: foreignAssetId })).rejects.toThrow(
        'Thumbnail asset must belong to the space',
      );

      expect(mocks.sharedSpace.update).not.toHaveBeenCalled();
    });

    it('should not allow editor to update name', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace();
      const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Editor });

      mocks.sharedSpace.getMember.mockResolvedValue(member);

      await expect(sut.update(auth, space.id, { name: 'New Name' })).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should not allow editor to update description', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace();
      const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Editor });

      mocks.sharedSpace.getMember.mockResolvedValue(member);

      await expect(sut.update(auth, space.id, { description: 'New Description' })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('should allow owner to update color', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace();
      const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Owner });
      const updatedSpace = { ...space, color: 'blue' };

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.update.mockResolvedValue(updatedSpace);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      const result = await sut.update(auth, space.id, { color: UserAvatarColor.Blue });

      expect(result.color).toBe('blue');
      expect(mocks.sharedSpace.update).toHaveBeenCalledWith(space.id, {
        name: undefined,
        description: undefined,
        thumbnailAssetId: undefined,
        thumbnailCropY: undefined,
        color: UserAvatarColor.Blue,
        faceRecognitionEnabled: undefined,
        petsEnabled: undefined,
      });
    });

    it('should not allow editor to update color', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace();
      const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Editor });

      mocks.sharedSpace.getMember.mockResolvedValue(member);

      await expect(sut.update(auth, space.id, { color: UserAvatarColor.Blue })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('should treat color update as metadata change (owner-only)', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace();
      const viewer = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Viewer });

      mocks.sharedSpace.getMember.mockResolvedValue(viewer);

      await expect(sut.update(auth, space.id, { color: UserAvatarColor.Red })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('should not allow viewer to update thumbnailAssetId', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace();
      const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Viewer });

      mocks.sharedSpace.getMember.mockResolvedValue(member);

      await expect(sut.update(auth, space.id, { thumbnailAssetId: newUuid() })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('should throw when user is viewer', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const member = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Viewer });

      mocks.sharedSpace.getMember.mockResolvedValue(member);

      await expect(sut.update(auth, spaceId, { name: 'New Name' })).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should pass thumbnailCropY to repository', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace();
      const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Editor });

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.update.mockResolvedValue({ ...space, thumbnailCropY: 30 });

      await sut.update(auth, space.id, { thumbnailCropY: 30 });

      expect(mocks.sharedSpace.update).toHaveBeenCalledWith(space.id, expect.objectContaining({ thumbnailCropY: 30 }));
    });

    it('should return thumbnailCropY in response', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace();
      const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Editor });

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.update.mockResolvedValue({ ...space, thumbnailCropY: 75 });

      const result = await sut.update(auth, space.id, { thumbnailCropY: 75 });

      expect(result.thumbnailCropY).toBe(75);
    });

    it('should clear thumbnailCropY when thumbnailAssetId changes', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace();
      const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Editor });

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.isAssetInSpace.mockResolvedValue(true);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.update.mockResolvedValue({ ...space, thumbnailAssetId: newUuid(), thumbnailCropY: null });
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.update(auth, space.id, { thumbnailAssetId: newUuid() });

      expect(mocks.sharedSpace.update).toHaveBeenCalledWith(
        space.id,
        expect.objectContaining({ thumbnailCropY: null }),
      );
    });

    it('should log space_rename when name changes', async () => {
      const space = factory.sharedSpace({ name: 'Old Name' });
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Owner }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.update.mockResolvedValue({ ...space, name: 'New Name' });
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      const auth = factory.auth();
      await sut.update(auth, space.id, { name: 'New Name' });

      expect(mocks.sharedSpace.logActivity).toHaveBeenCalledWith({
        spaceId: space.id,
        userId: auth.user.id,
        type: SharedSpaceActivityType.SpaceRename,
        data: { oldName: 'Old Name', newName: 'New Name' },
      });
    });

    it('should log space_color_change when color changes', async () => {
      const space = factory.sharedSpace({ color: 'primary' });
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Owner }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.update.mockResolvedValue({ ...space, color: 'blue' });
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      const auth = factory.auth();
      await sut.update(auth, space.id, { color: UserAvatarColor.Blue });

      expect(mocks.sharedSpace.logActivity).toHaveBeenCalledWith({
        spaceId: space.id,
        userId: auth.user.id,
        type: SharedSpaceActivityType.SpaceColorChange,
        data: { oldColor: 'primary', newColor: UserAvatarColor.Blue },
      });
    });

    it('should log cover_change when thumbnailAssetId changes', async () => {
      const space = factory.sharedSpace({ thumbnailAssetId: null });
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
      mocks.sharedSpace.isAssetInSpace.mockResolvedValue(true);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.update.mockResolvedValue({ ...space, thumbnailAssetId: 'asset-1' });
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      const auth = factory.auth();
      await sut.update(auth, space.id, { thumbnailAssetId: 'asset-1' });

      expect(mocks.sharedSpace.logActivity).toHaveBeenCalledWith({
        spaceId: space.id,
        userId: auth.user.id,
        type: SharedSpaceActivityType.CoverChange,
        data: { assetId: 'asset-1' },
      });
    });

    it('should not log activity when description changes (no specific event type)', async () => {
      const space = factory.sharedSpace({ description: null });
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Owner }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.update.mockResolvedValue(space);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.update(factory.auth(), space.id, { description: 'New desc' });

      expect(mocks.sharedSpace.logActivity).not.toHaveBeenCalled();
    });

    it('should require owner role for faceRecognitionEnabled', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace();
      const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Editor });

      mocks.sharedSpace.getMember.mockResolvedValue(member);

      await expect(sut.update(auth, space.id, { faceRecognitionEnabled: true })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('should update faceRecognitionEnabled when owner', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace({ faceRecognitionEnabled: false });
      const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Owner });
      const updatedSpace = { ...space, faceRecognitionEnabled: true };

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.update.mockResolvedValue(updatedSpace);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      const result = await sut.update(auth, space.id, { faceRecognitionEnabled: true });

      expect(result.faceRecognitionEnabled).toBe(true);
      expect(mocks.sharedSpace.update).toHaveBeenCalledWith(
        space.id,
        expect.objectContaining({
          faceRecognitionEnabled: true,
        }),
      );
    });

    it('should queue SharedSpaceFaceMatchAll when toggling faceRecognitionEnabled from false to true', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace({ faceRecognitionEnabled: false });
      const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Owner });

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.update.mockResolvedValue({ ...space, faceRecognitionEnabled: true });
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.update(auth, space.id, { faceRecognitionEnabled: true });

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.SharedSpaceFaceMatchAll,
        data: { spaceId: space.id },
      });
    });

    it('should not queue SharedSpaceFaceMatchAll when toggling from true to false', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace({ faceRecognitionEnabled: true });
      const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Owner });

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.update.mockResolvedValue({ ...space, faceRecognitionEnabled: false });
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.update(auth, space.id, { faceRecognitionEnabled: false });

      expect(mocks.job.queue).not.toHaveBeenCalledWith(
        expect.objectContaining({ name: JobName.SharedSpaceFaceMatchAll }),
      );
    });

    it('should not queue SharedSpaceFaceMatchAll when faceRecognitionEnabled is already true', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace({ faceRecognitionEnabled: true });
      const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Owner });

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.update.mockResolvedValue(space);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.update(auth, space.id, { faceRecognitionEnabled: true });

      expect(mocks.job.queue).not.toHaveBeenCalledWith(
        expect.objectContaining({ name: JobName.SharedSpaceFaceMatchAll }),
      );
    });

    it('should require owner role when updating petsEnabled', async () => {
      const spaceId = newUuid();
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ spaceId, role: SharedSpaceRole.Editor }));

      await expect(sut.update(factory.auth(), spaceId, { petsEnabled: false })).rejects.toThrow('Insufficient role');
    });

    it('should pass petsEnabled to repository update', async () => {
      const spaceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId });
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ spaceId, role: SharedSpaceRole.Owner }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.update.mockResolvedValue(space);

      await sut.update(factory.auth(), spaceId, { petsEnabled: false });

      expect(mocks.sharedSpace.update).toHaveBeenCalledWith(spaceId, expect.objectContaining({ petsEnabled: false }));
    });

    it('should reject editor updating petsEnabled (metadata requires owner)', async () => {
      const spaceId = newUuid();
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ spaceId, role: SharedSpaceRole.Editor }));

      await expect(
        sut.update(factory.auth(), spaceId, { faceRecognitionEnabled: true, petsEnabled: false }),
      ).rejects.toThrow('Insufficient role');
    });
  });

  describe('remove', () => {
    it('should remove when user is owner', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const member = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Owner });

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.remove.mockResolvedValue(void 0);

      await sut.remove(auth, spaceId);

      expect(mocks.sharedSpace.remove).toHaveBeenCalledWith(spaceId);
    });

    it('should throw when non-owner tries to delete', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const member = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Editor });

      mocks.sharedSpace.getMember.mockResolvedValue(member);

      await expect(sut.remove(auth, spaceId)).rejects.toBeInstanceOf(ForbiddenException);
      expect(mocks.sharedSpace.remove).not.toHaveBeenCalled();
    });
  });

  describe('getMembers', () => {
    it('should return members with contribution counts', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const member = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Owner });

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getMembers.mockResolvedValue([member]);
      mocks.sharedSpace.getContributionCounts.mockResolvedValue([{ addedById: auth.user.id, count: 42n }]);
      mocks.sharedSpace.getMemberActivity.mockResolvedValue([
        { addedById: auth.user.id, lastAddedAt: newDate(), recentAssetId: 'asset-1' },
      ]);

      const result = await sut.getMembers(auth, spaceId);

      expect(result[0].contributionCount).toBe(42);
      expect(result[0].recentAssetId).toBe('asset-1');
      expect(result[0].lastActiveAt).toBeDefined();
    });

    it('should return 0 contribution count for members with no contributions', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const member = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Viewer });

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getMembers.mockResolvedValue([member]);
      mocks.sharedSpace.getContributionCounts.mockResolvedValue([]);
      mocks.sharedSpace.getMemberActivity.mockResolvedValue([]);

      const result = await sut.getMembers(auth, spaceId);

      expect(result[0].contributionCount).toBe(0);
      expect(result[0].recentAssetId).toBeNull();
      expect(result[0].lastActiveAt).toBeNull();
    });

    it('should sort members: owner first, then by contribution count desc', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const ownerId = auth.user.id;
      const editorId = newUuid();
      const viewerId = newUuid();
      const owner = makeMemberResult({ spaceId, userId: ownerId, role: SharedSpaceRole.Owner, name: 'Owner' });
      const editor = makeMemberResult({ spaceId, userId: editorId, role: SharedSpaceRole.Editor, name: 'Editor' });
      const viewer = makeMemberResult({ spaceId, userId: viewerId, role: SharedSpaceRole.Viewer, name: 'Viewer' });

      mocks.sharedSpace.getMember.mockResolvedValue(owner);
      mocks.sharedSpace.getMembers.mockResolvedValue([viewer, editor, owner]);
      mocks.sharedSpace.getContributionCounts.mockResolvedValue([
        { addedById: viewerId, count: 100n },
        { addedById: editorId, count: 50n },
        { addedById: ownerId, count: 10n },
      ]);
      mocks.sharedSpace.getMemberActivity.mockResolvedValue([]);

      const result = await sut.getMembers(auth, spaceId);

      expect(result[0].name).toBe('Owner');
      expect(result[1].name).toBe('Viewer');
      expect(result[2].name).toBe('Editor');
    });
  });

  describe('addMember', () => {
    it('should add member with default viewer role', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const newUserId = newUuid();
      const ownerMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Owner });
      const newMember = makeMemberResult({
        spaceId,
        userId: newUserId,
        role: SharedSpaceRole.Viewer,
        name: 'New User',
      });

      mocks.sharedSpace.getMember
        .mockResolvedValueOnce(ownerMember) // requireRole check
        .mockResolvedValueOnce(void 0) // duplicate check
        .mockResolvedValueOnce(newMember); // fetch after add
      mocks.sharedSpace.addMember.mockResolvedValue(
        factory.sharedSpaceMember({
          spaceId,
          userId: newUserId,
          role: SharedSpaceRole.Viewer,
        }),
      );
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      const result = await sut.addMember(auth, spaceId, { userId: newUserId });

      expect(result.userId).toBe(newUserId);
      expect(result.name).toBe('New User');
      expect(mocks.sharedSpace.addMember).toHaveBeenCalledWith({
        spaceId,
        userId: newUserId,
        role: SharedSpaceRole.Viewer,
      });
    });

    it('should throw if user is already a member', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const existingUserId = newUuid();
      const ownerMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Owner });
      const existingMember = makeMemberResult({ spaceId, userId: existingUserId });

      mocks.sharedSpace.getMember
        .mockResolvedValueOnce(ownerMember) // requireRole check
        .mockResolvedValueOnce(existingMember); // duplicate check

      await expect(sut.addMember(auth, spaceId, { userId: existingUserId })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mocks.sharedSpace.addMember).not.toHaveBeenCalled();
    });

    it('should throw if non-owner tries to add', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const editorMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Editor });

      mocks.sharedSpace.getMember.mockResolvedValue(editorMember);

      await expect(sut.addMember(auth, spaceId, { userId: newUuid() })).rejects.toBeInstanceOf(ForbiddenException);
      expect(mocks.sharedSpace.addMember).not.toHaveBeenCalled();
    });

    it('should log activity when adding a member', async () => {
      const auth = factory.auth();
      mocks.sharedSpace.getMember.mockResolvedValueOnce(makeMemberResult({ role: SharedSpaceRole.Owner }));
      mocks.sharedSpace.getMember.mockResolvedValueOnce(void 0);
      mocks.sharedSpace.addMember.mockResolvedValue(factory.sharedSpaceMember());
      mocks.sharedSpace.getMember.mockResolvedValueOnce(
        makeMemberResult({ userId: 'new-user', role: SharedSpaceRole.Editor }),
      );
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.addMember(auth, 'space-1', { userId: 'new-user', role: SharedSpaceRole.Editor });

      expect(mocks.sharedSpace.logActivity).toHaveBeenCalledWith({
        spaceId: 'space-1',
        userId: 'new-user',
        type: SharedSpaceActivityType.MemberJoin,
        data: { role: SharedSpaceRole.Editor, invitedById: auth.user.id },
      });
    });
  });

  describe('updateMember', () => {
    it('should change role', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const targetUserId = newUuid();
      const ownerMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Owner });
      const existingMember = makeMemberResult({ spaceId, userId: targetUserId, role: SharedSpaceRole.Viewer });
      const updatedMember = makeMemberResult({ spaceId, userId: targetUserId, role: SharedSpaceRole.Editor });

      mocks.sharedSpace.getMember
        .mockResolvedValueOnce(ownerMember) // requireRole check
        .mockResolvedValueOnce(existingMember) // pre-update fetch for oldRole
        .mockResolvedValueOnce(updatedMember); // fetch after update
      mocks.sharedSpace.updateMember.mockResolvedValue(
        factory.sharedSpaceMember({
          spaceId,
          userId: targetUserId,
          role: SharedSpaceRole.Editor,
        }),
      );
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      const result = await sut.updateMember(auth, spaceId, targetUserId, { role: SharedSpaceRole.Editor });

      expect(result.role).toBe(SharedSpaceRole.Editor);
      expect(mocks.sharedSpace.updateMember).toHaveBeenCalledWith(spaceId, targetUserId, {
        role: SharedSpaceRole.Editor,
      });
    });

    it('should throw when changing own role', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const ownerMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Owner });

      mocks.sharedSpace.getMember.mockResolvedValue(ownerMember);

      await expect(
        sut.updateMember(auth, spaceId, auth.user.id, { role: SharedSpaceRole.Editor }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.sharedSpace.updateMember).not.toHaveBeenCalled();
    });

    it('should throw if non-owner tries to change role', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const editorMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Editor });

      mocks.sharedSpace.getMember.mockResolvedValue(editorMember);

      await expect(sut.updateMember(auth, spaceId, newUuid(), { role: SharedSpaceRole.Editor })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(mocks.sharedSpace.updateMember).not.toHaveBeenCalled();
    });

    it('should log activity when changing a member role', async () => {
      const auth = factory.auth({ user: { id: 'owner-1' } });
      // requireRole check
      mocks.sharedSpace.getMember.mockResolvedValueOnce(
        makeMemberResult({ userId: 'owner-1', role: SharedSpaceRole.Owner }),
      );
      // pre-update fetch for oldRole
      mocks.sharedSpace.getMember.mockResolvedValueOnce(
        makeMemberResult({ userId: 'target-user', role: SharedSpaceRole.Viewer }),
      );
      mocks.sharedSpace.updateMember.mockResolvedValue(factory.sharedSpaceMember());
      // post-update fetch
      mocks.sharedSpace.getMember.mockResolvedValueOnce(
        makeMemberResult({ userId: 'target-user', role: SharedSpaceRole.Editor }),
      );
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.updateMember(auth, 'space-1', 'target-user', { role: SharedSpaceRole.Editor });

      expect(mocks.sharedSpace.logActivity).toHaveBeenCalledWith({
        spaceId: 'space-1',
        userId: auth.user.id,
        type: SharedSpaceActivityType.MemberRoleChange,
        data: { targetUserId: 'target-user', oldRole: SharedSpaceRole.Viewer, newRole: SharedSpaceRole.Editor },
      });
    });

    it('should allow any member to toggle their own showInTimeline', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const viewerMember = makeMemberResult({
        spaceId,
        userId: auth.user.id,
        role: SharedSpaceRole.Viewer,
        showInTimeline: true,
      });
      const updatedMember = makeMemberResult({
        spaceId,
        userId: auth.user.id,
        role: SharedSpaceRole.Viewer,
        showInTimeline: false,
      });

      mocks.sharedSpace.getMember
        .mockResolvedValueOnce(viewerMember) // requireMembership check
        .mockResolvedValueOnce(updatedMember); // fetch after update
      mocks.sharedSpace.updateMember.mockResolvedValue(
        factory.sharedSpaceMember({
          spaceId,
          userId: auth.user.id,
          showInTimeline: false,
        }),
      );

      const result = await sut.updateMemberTimeline(auth, spaceId, { showInTimeline: false });

      expect(result.showInTimeline).toBe(false);
      expect(mocks.sharedSpace.updateMember).toHaveBeenCalledWith(spaceId, auth.user.id, {
        showInTimeline: false,
      });
    });

    it('should throw when non-member tries to toggle timeline', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();

      mocks.sharedSpace.getMember.mockResolvedValue(void 0);

      await expect(sut.updateMemberTimeline(auth, spaceId, { showInTimeline: false })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('removeMember', () => {
    it('should allow owner to remove others', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const targetUserId = newUuid();
      const ownerMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Owner });

      mocks.sharedSpace.getMember.mockResolvedValue(ownerMember);
      mocks.sharedSpace.removeMember.mockResolvedValue(void 0);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.removeMember(auth, spaceId, targetUserId);

      expect(mocks.sharedSpace.removeMember).toHaveBeenCalledWith(spaceId, targetUserId);
    });

    it('should allow non-owner to leave (self-remove)', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const viewerMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Viewer });

      mocks.sharedSpace.getMember.mockResolvedValue(viewerMember);
      mocks.sharedSpace.removeMember.mockResolvedValue(void 0);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.removeMember(auth, spaceId, auth.user.id);

      expect(mocks.sharedSpace.removeMember).toHaveBeenCalledWith(spaceId, auth.user.id);
    });

    it('should throw if owner tries to leave', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const ownerMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Owner });

      mocks.sharedSpace.getMember.mockResolvedValue(ownerMember);

      await expect(sut.removeMember(auth, spaceId, auth.user.id)).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.sharedSpace.removeMember).not.toHaveBeenCalled();
    });

    it('should throw if non-owner tries to remove others', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const viewerMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Viewer });

      mocks.sharedSpace.getMember.mockResolvedValue(viewerMember);

      await expect(sut.removeMember(auth, spaceId, newUuid())).rejects.toBeInstanceOf(ForbiddenException);
      expect(mocks.sharedSpace.removeMember).not.toHaveBeenCalled();
    });

    it('should log member_leave when member leaves', async () => {
      const auth = factory.auth({ user: { id: 'user-1' } });
      mocks.sharedSpace.getMember.mockResolvedValue(
        makeMemberResult({ userId: 'user-1', role: SharedSpaceRole.Editor }),
      );
      mocks.sharedSpace.removeMember.mockResolvedValue(void 0);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.removeMember(auth, 'space-1', 'user-1');

      expect(mocks.sharedSpace.logActivity).toHaveBeenCalledWith({
        spaceId: 'space-1',
        userId: 'user-1',
        type: SharedSpaceActivityType.MemberLeave,
        data: {},
      });
    });

    it('should log member_remove when owner removes a member', async () => {
      const auth = factory.auth({ user: { id: 'owner-1' } });
      mocks.sharedSpace.getMember.mockResolvedValue(
        makeMemberResult({ userId: 'owner-1', role: SharedSpaceRole.Owner }),
      );
      mocks.sharedSpace.removeMember.mockResolvedValue(void 0);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.removeMember(auth, 'space-1', 'other-user');

      expect(mocks.sharedSpace.logActivity).toHaveBeenCalledWith({
        spaceId: 'space-1',
        userId: auth.user.id,
        type: SharedSpaceActivityType.MemberRemove,
        data: { removedUserId: 'other-user' },
      });
    });
  });

  describe('addAssets', () => {
    it('should add assets when editor', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const assetId1 = newUuid();
      const assetId2 = newUuid();
      const editorMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Editor });
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false });

      mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId1, assetId2]));
      mocks.sharedSpace.addAssets.mockResolvedValue([]);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.update.mockResolvedValue(space);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.addAssets(auth, spaceId, { assetIds: [assetId1, assetId2] });

      expect(mocks.sharedSpace.addAssets).toHaveBeenCalledWith([
        { spaceId, assetId: assetId1, addedById: auth.user.id },
        { spaceId, assetId: assetId2, addedById: auth.user.id },
      ]);
    });

    it('should reject adding assets the user does not have access to', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const ownedAssetId = newUuid();
      const foreignAssetId = newUuid();
      const editorMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Editor });

      mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([ownedAssetId]));
      mocks.access.asset.checkAlbumAccess.mockResolvedValue(new Set());
      mocks.access.asset.checkPartnerAccess.mockResolvedValue(new Set());
      mocks.access.asset.checkSpaceAccess.mockResolvedValue(new Set());

      await expect(sut.addAssets(auth, spaceId, { assetIds: [ownedAssetId, foreignAssetId] })).rejects.toThrow();

      expect(mocks.sharedSpace.addAssets).not.toHaveBeenCalled();
    });

    it('should NOT auto-set thumbnailAssetId when space has no thumbnail', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const assetId1 = newUuid();
      const editorMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Editor });
      const space = factory.sharedSpace({ id: spaceId, thumbnailAssetId: null, faceRecognitionEnabled: false });

      mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId1]));
      mocks.sharedSpace.addAssets.mockResolvedValue([]);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.update.mockResolvedValue(space);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.addAssets(auth, spaceId, { assetIds: [assetId1] });

      expect(mocks.sharedSpace.update).toHaveBeenCalledWith(spaceId, { lastActivityAt: expect.any(Date) });
    });

    it('should update lastActivityAt when adding assets', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const assetId = newUuid();
      const editorMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Editor });
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false });

      mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
      mocks.sharedSpace.addAssets.mockResolvedValue([]);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.update.mockResolvedValue(space);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.addAssets(auth, spaceId, { assetIds: [assetId] });

      expect(mocks.sharedSpace.update).toHaveBeenCalledWith(
        spaceId,
        expect.objectContaining({ lastActivityAt: expect.any(Date) }),
      );
    });

    it('should throw when viewer tries to add', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const viewerMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Viewer });

      mocks.sharedSpace.getMember.mockResolvedValue(viewerMember);

      await expect(sut.addAssets(auth, spaceId, { assetIds: [newUuid()] })).rejects.toBeInstanceOf(ForbiddenException);
      expect(mocks.sharedSpace.addAssets).not.toHaveBeenCalled();
    });

    it('should log activity when adding assets', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace({ faceRecognitionEnabled: false });
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['a1', 'a2', 'a3']));
      mocks.sharedSpace.addAssets.mockResolvedValue([
        { spaceId: 'space-1', assetId: 'a1', addedById: auth.user.id },
        { spaceId: 'space-1', assetId: 'a2', addedById: auth.user.id },
        { spaceId: 'space-1', assetId: 'a3', addedById: auth.user.id },
      ] as any);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.update.mockResolvedValue(space);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.addAssets(auth, 'space-1', { assetIds: ['a1', 'a2', 'a3'] });

      expect(mocks.sharedSpace.logActivity).toHaveBeenCalledWith({
        spaceId: 'space-1',
        userId: auth.user.id,
        type: SharedSpaceActivityType.AssetAdd,
        data: { count: 3, assetIds: ['a1', 'a2', 'a3'] },
      });
    });

    it('should log actual inserted count, not requested count', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false });
      const existingAssetId = newUuid();
      const newAssetId = newUuid();

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([existingAssetId, newAssetId]));
      // Only 1 row returned — the other was a duplicate (ON CONFLICT DO NOTHING)
      mocks.sharedSpace.addAssets.mockResolvedValue([{ spaceId, assetId: newAssetId, addedById: auth.user.id }] as any);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.update.mockResolvedValue(space);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.addAssets(auth, spaceId, { assetIds: [existingAssetId, newAssetId] });

      expect(mocks.sharedSpace.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ count: 1 }),
        }),
      );
    });

    it('should queue SharedSpaceFaceMatch jobs when faceRecognitionEnabled is true', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const assetId1 = newUuid();
      const assetId2 = newUuid();
      const editorMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Editor });
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });

      mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId1, assetId2]));
      mocks.sharedSpace.addAssets.mockResolvedValue([]);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.update.mockResolvedValue(space);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.addAssets(auth, spaceId, { assetIds: [assetId1, assetId2] });

      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.SharedSpaceFaceMatch, data: { spaceId, assetId: assetId1 } },
        { name: JobName.SharedSpaceFaceMatch, data: { spaceId, assetId: assetId2 } },
      ]);
    });

    it('should not queue SharedSpaceFaceMatch jobs when faceRecognitionEnabled is false', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const assetId = newUuid();
      const editorMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Editor });
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false });

      mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
      mocks.sharedSpace.addAssets.mockResolvedValue([]);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.update.mockResolvedValue(space);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.addAssets(auth, spaceId, { assetIds: [assetId] });

      expect(mocks.job.queue).not.toHaveBeenCalledWith(expect.objectContaining({ name: JobName.SharedSpaceFaceMatch }));
    });
  });

  describe('queueBulkAdd', () => {
    it('should queue SharedSpaceBulkAddAssets job when called by editor', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const editorMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Editor });

      mocks.sharedSpace.getMember.mockResolvedValue(editorMember);

      await sut.queueBulkAdd(auth, spaceId);

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.SharedSpaceBulkAddAssets,
        data: { spaceId, userId: auth.user.id },
      });
    });

    it('should queue job when called by owner', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const ownerMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Owner });

      mocks.sharedSpace.getMember.mockResolvedValue(ownerMember);

      await sut.queueBulkAdd(auth, spaceId);

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.SharedSpaceBulkAddAssets,
        data: { spaceId, userId: auth.user.id },
      });
    });

    it('should throw ForbiddenException when called by viewer', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const viewerMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Viewer });

      mocks.sharedSpace.getMember.mockResolvedValue(viewerMember);

      await expect(sut.queueBulkAdd(auth, spaceId)).rejects.toBeInstanceOf(ForbiddenException);
      expect(mocks.job.queue).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when called by non-member', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();

      mocks.sharedSpace.getMember.mockResolvedValue(void 0);

      await expect(sut.queueBulkAdd(auth, spaceId)).rejects.toBeInstanceOf(ForbiddenException);
      expect(mocks.job.queue).not.toHaveBeenCalled();
    });

    it('should return spaceId', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const editorMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Editor });

      mocks.sharedSpace.getMember.mockResolvedValue(editorMember);

      const result = await sut.queueBulkAdd(auth, spaceId);

      expect(result).toEqual({ spaceId });
    });
  });

  describe('removeAssets', () => {
    beforeEach(() => {
      mocks.sharedSpace.removePersonFacesByAssetIds.mockResolvedValue(void 0);
      mocks.sharedSpace.deleteOrphanedPersons.mockResolvedValue(void 0);
    });

    it('should throw when space is not found after role check', async () => {
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
      mocks.sharedSpace.getById.mockResolvedValue(void 0);

      await expect(sut.removeAssets(factory.auth(), newUuid(), { assetIds: [newUuid()] })).rejects.toThrow(
        'Space not found',
      );
    });

    it('should remove assets when editor', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const assetId1 = newUuid();
      const assetId2 = newUuid();
      const editorMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Editor });

      mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId }));
      mocks.sharedSpace.removeAssets.mockResolvedValue(void 0);
      mocks.sharedSpace.getLastAssetAddedAt.mockResolvedValue(new Date());
      mocks.sharedSpace.update.mockResolvedValue(factory.sharedSpace({ id: spaceId }));
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.removeAssets(auth, spaceId, { assetIds: [assetId1, assetId2] });

      expect(mocks.sharedSpace.removeAssets).toHaveBeenCalledWith(spaceId, [assetId1, assetId2]);
    });

    it('should recompute lastActivityAt after removing assets', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const lastDate = new Date('2026-03-01T00:00:00.000Z');
      const editorMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Editor });

      mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId }));
      mocks.sharedSpace.removeAssets.mockResolvedValue(void 0);
      mocks.sharedSpace.getLastAssetAddedAt.mockResolvedValue(lastDate);
      mocks.sharedSpace.update.mockResolvedValue(factory.sharedSpace({ id: spaceId, lastActivityAt: lastDate }));
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.removeAssets(auth, spaceId, { assetIds: [newUuid()] });

      expect(mocks.sharedSpace.getLastAssetAddedAt).toHaveBeenCalledWith(spaceId);
      expect(mocks.sharedSpace.update).toHaveBeenCalledWith(spaceId, { lastActivityAt: lastDate });
    });

    it('should set lastActivityAt to null when removing last assets', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const editorMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Editor });

      mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId }));
      mocks.sharedSpace.removeAssets.mockResolvedValue(void 0);
      mocks.sharedSpace.getLastAssetAddedAt.mockResolvedValue(void 0);
      mocks.sharedSpace.update.mockResolvedValue(factory.sharedSpace({ id: spaceId, lastActivityAt: null }));
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.removeAssets(auth, spaceId, { assetIds: [newUuid()] });

      expect(mocks.sharedSpace.update).toHaveBeenCalledWith(spaceId, { lastActivityAt: null });
    });

    it('should clear thumbnailAssetId when the cover photo is removed', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const coverAssetId = newUuid();
      const editorMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Editor });
      const space = factory.sharedSpace({ id: spaceId, thumbnailAssetId: coverAssetId });

      mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.removeAssets.mockResolvedValue(void 0);
      mocks.sharedSpace.getLastAssetAddedAt.mockResolvedValue(void 0);
      mocks.sharedSpace.update.mockResolvedValue(factory.sharedSpace({ id: spaceId, thumbnailAssetId: null }));
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.removeAssets(auth, spaceId, { assetIds: [coverAssetId] });

      expect(mocks.sharedSpace.update).toHaveBeenCalledWith(spaceId, {
        lastActivityAt: null,
        thumbnailAssetId: null,
      });
    });

    it('should not clear thumbnailAssetId when a non-cover photo is removed', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const coverAssetId = newUuid();
      const otherAssetId = newUuid();
      const editorMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Editor });
      const space = factory.sharedSpace({ id: spaceId, thumbnailAssetId: coverAssetId });

      mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.removeAssets.mockResolvedValue(void 0);
      mocks.sharedSpace.getLastAssetAddedAt.mockResolvedValue(new Date());
      mocks.sharedSpace.update.mockResolvedValue(factory.sharedSpace({ id: spaceId }));
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.removeAssets(auth, spaceId, { assetIds: [otherAssetId] });

      expect(mocks.sharedSpace.update).toHaveBeenCalledWith(spaceId, {
        lastActivityAt: expect.any(Date),
      });
    });

    it('should throw when viewer tries to remove', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const viewerMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Viewer });

      mocks.sharedSpace.getMember.mockResolvedValue(viewerMember);

      await expect(sut.removeAssets(auth, spaceId, { assetIds: [newUuid()] })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(mocks.sharedSpace.removeAssets).not.toHaveBeenCalled();
    });

    it('should log activity when removing assets', async () => {
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace());
      mocks.sharedSpace.removeAssets.mockResolvedValue(void 0);
      mocks.sharedSpace.getLastAssetAddedAt.mockResolvedValue(void 0);
      mocks.sharedSpace.update.mockResolvedValue(factory.sharedSpace());
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      const auth = factory.auth();
      await sut.removeAssets(auth, 'space-1', { assetIds: ['a1', 'a2'] });

      expect(mocks.sharedSpace.logActivity).toHaveBeenCalledWith({
        spaceId: 'space-1',
        userId: auth.user.id,
        type: SharedSpaceActivityType.AssetRemove,
        data: { count: 2 },
      });
    });

    it('should remove person faces by asset IDs after removing assets', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const assetId = newUuid();
      const editorMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Editor });

      mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId }));
      mocks.sharedSpace.removeAssets.mockResolvedValue(void 0);
      mocks.sharedSpace.getLastAssetAddedAt.mockResolvedValue(new Date());
      mocks.sharedSpace.update.mockResolvedValue(factory.sharedSpace({ id: spaceId }));
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);
      mocks.sharedSpace.removePersonFacesByAssetIds.mockResolvedValue(void 0);
      mocks.sharedSpace.deleteOrphanedPersons.mockResolvedValue(void 0);

      await sut.removeAssets(auth, spaceId, { assetIds: [assetId] });

      expect(mocks.sharedSpace.removePersonFacesByAssetIds).toHaveBeenCalledWith(spaceId, [assetId]);
      expect(mocks.sharedSpace.deleteOrphanedPersons).toHaveBeenCalledWith(spaceId);
    });
  });

  describe('getMapMarkers', () => {
    it('should require shared space read access', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();

      mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set());

      await expect(sut.getMapMarkers(auth, spaceId)).rejects.toThrow();
      expect(mocks.sharedSpace.getMapMarkers).not.toHaveBeenCalled();
    });

    it('should return map markers for space assets', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const assetId1 = newUuid();
      const assetId2 = newUuid();

      mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set([spaceId]));
      mocks.sharedSpace.getMapMarkers.mockResolvedValue([
        { id: assetId1, latitude: 40.7128, longitude: -74.006, city: 'New York', state: 'New York', country: 'USA' },
        {
          id: assetId2,
          latitude: 34.0522,
          longitude: -118.2437,
          city: 'Los Angeles',
          state: 'California',
          country: 'USA',
        },
      ]);

      const result = await sut.getMapMarkers(auth, spaceId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual<MapMarkerResponseDto>({
        id: assetId1,
        lat: 40.7128,
        lon: -74.006,
        city: 'New York',
        state: 'New York',
        country: 'USA',
      });
      expect(result[1]).toEqual<MapMarkerResponseDto>({
        id: assetId2,
        lat: 34.0522,
        lon: -118.2437,
        city: 'Los Angeles',
        state: 'California',
        country: 'USA',
      });
      expect(mocks.access.sharedSpace.checkMemberAccess).toHaveBeenCalledWith(auth.user.id, new Set([spaceId]));
    });

    it('should return empty array when space has no geotagged assets', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();

      mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set([spaceId]));
      mocks.sharedSpace.getMapMarkers.mockResolvedValue([]);

      const result = await sut.getMapMarkers(auth, spaceId);

      expect(result).toEqual([]);
      expect(mocks.sharedSpace.getMapMarkers).toHaveBeenCalledWith(spaceId);
    });

    it('should map marker fields correctly with null city/state/country', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const assetId = newUuid();

      mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set([spaceId]));
      mocks.sharedSpace.getMapMarkers.mockResolvedValue([
        { id: assetId, latitude: 51.5074, longitude: -0.1278, city: null, state: null, country: null },
      ]);

      const result = await sut.getMapMarkers(auth, spaceId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual<MapMarkerResponseDto>({
        id: assetId,
        lat: 51.5074,
        lon: -0.1278,
        city: null,
        state: null,
        country: null,
      });
    });
  });

  describe('markSpaceViewed', () => {
    it('should update lastViewedAt for the calling user', async () => {
      const auth = factory.auth();
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.updateMemberLastViewed.mockResolvedValue(void 0);

      await sut.markSpaceViewed(auth, 'space-1');

      expect(mocks.sharedSpace.updateMemberLastViewed).toHaveBeenCalledWith('space-1', auth.user.id);
    });

    it('should throw for non-members', async () => {
      const auth = factory.auth();
      mocks.sharedSpace.getMember.mockResolvedValue(void 0);

      await expect(sut.markSpaceViewed(auth, 'space-1')).rejects.toThrow('Not a member of this space');
    });
  });

  describe('getActivities', () => {
    it('should require membership', async () => {
      mocks.sharedSpace.getMember.mockResolvedValue(void 0);
      await expect(sut.getActivities(factory.auth(), 'space-1', {})).rejects.toThrow('Not a member');
    });

    it('should return mapped activities', async () => {
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult());
      mocks.sharedSpace.getActivities.mockResolvedValue([
        {
          id: 'act-1',
          type: 'asset_add',
          data: { count: 5 },
          createdAt: new Date('2026-03-10T12:00:00Z'),
          userId: 'user-1',
          name: 'Pierre',
          email: 'pierre@test.com',
          profileImagePath: '/path/to/img',
          avatarColor: UserAvatarColor.Primary,
        },
      ]);

      const result = await sut.getActivities(factory.auth(), 'space-1', {});

      expect(result).toEqual([
        {
          id: 'act-1',
          type: 'asset_add',
          data: { count: 5 },
          createdAt: '2026-03-10T12:00:00.000Z',
          userId: 'user-1',
          userName: 'Pierre',
          userEmail: 'pierre@test.com',
          userProfileImagePath: '/path/to/img',
          userAvatarColor: 'primary',
        },
      ]);
    });

    it('should pass limit and offset to repository', async () => {
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult());
      mocks.sharedSpace.getActivities.mockResolvedValue([]);

      await sut.getActivities(factory.auth(), 'space-1', { limit: 10, offset: 20 });

      expect(mocks.sharedSpace.getActivities).toHaveBeenCalledWith('space-1', 10, 20);
    });
  });

  describe('handleSharedSpaceFaceMatch', () => {
    it('should skip when space not found', async () => {
      mocks.sharedSpace.getById.mockResolvedValue(void 0);

      const result = await sut.handleSharedSpaceFaceMatch({ spaceId: 'space-1', assetId: 'asset-1' });

      expect(result).toBe(JobStatus.Skipped);
    });

    it('should skip when face recognition is disabled on the space', async () => {
      const space = factory.sharedSpace({ faceRecognitionEnabled: false });
      mocks.sharedSpace.getById.mockResolvedValue(space);

      const result = await sut.handleSharedSpaceFaceMatch({ spaceId: space.id, assetId: 'asset-1' });

      expect(result).toBe(JobStatus.Skipped);
    });

    it('should skip faces that are already assigned in the space', async () => {
      const spaceId = newUuid();
      const assetId = newUuid();
      const faceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
      const embedding = '[1,2,3]';

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
        { id: faceId, assetId, personId: null, embedding },
      ]);
      mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(true);
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      const result = await sut.handleSharedSpaceFaceMatch({ spaceId, assetId });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.sharedSpace.findClosestSpacePerson).not.toHaveBeenCalled();
    });

    it('should match face to existing person when distance is within threshold', async () => {
      const spaceId = newUuid();
      const assetId = newUuid();
      const faceId = newUuid();
      const personId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
      const embedding = '[1,2,3]';

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
        { id: faceId, assetId, personId: null, embedding },
      ]);
      mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(false);
      mocks.sharedSpace.findClosestSpacePerson.mockResolvedValue([{ personId, name: 'Alice', distance: 0.3 }]);
      mocks.sharedSpace.addPersonFaces.mockResolvedValue([]);
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      const result = await sut.handleSharedSpaceFaceMatch({ spaceId, assetId });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.sharedSpace.addPersonFaces).toHaveBeenCalledWith([{ personId, assetFaceId: faceId }]);
    });

    it('should create new person when no match is found', async () => {
      const spaceId = newUuid();
      const assetId = newUuid();
      const faceId = newUuid();
      const newPersonId = newUuid();
      const personalPersonId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
      const embedding = '[1,2,3]';
      const newPerson = factory.sharedSpacePerson({ id: newPersonId, spaceId });
      const personalPerson = factory.person({ id: personalPersonId, name: '' });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
        { id: faceId, assetId, personId: personalPersonId, embedding },
      ]);
      mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(false);
      mocks.sharedSpace.findClosestSpacePerson.mockResolvedValue([]);
      mocks.sharedSpace.createPerson.mockResolvedValue(newPerson);
      mocks.sharedSpace.addPersonFaces.mockResolvedValue([]);
      mocks.person.getById.mockResolvedValue(personalPerson);
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      const result = await sut.handleSharedSpaceFaceMatch({ spaceId, assetId });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.sharedSpace.createPerson).toHaveBeenCalledWith({
        spaceId,
        name: '',
        representativeFaceId: faceId,
        type: 'person',
      });
      expect(mocks.sharedSpace.addPersonFaces).toHaveBeenCalledWith([{ personId: newPersonId, assetFaceId: faceId }]);
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.SharedSpacePersonThumbnail,
        data: { id: newPersonId },
      });
    });

    it('should create new person when distance exceeds threshold', async () => {
      const spaceId = newUuid();
      const assetId = newUuid();
      const faceId = newUuid();
      const newPersonId = newUuid();
      const personalPersonId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
      const embedding = '[1,2,3]';
      const newPerson = factory.sharedSpacePerson({ id: newPersonId, spaceId });
      const personalPerson = factory.person({ id: personalPersonId, name: '' });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
        { id: faceId, assetId, personId: personalPersonId, embedding },
      ]);
      mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(false);
      // Returns empty array because the findClosestSpacePerson query already filters by maxDistance
      mocks.sharedSpace.findClosestSpacePerson.mockResolvedValue([]);
      mocks.sharedSpace.createPerson.mockResolvedValue(newPerson);
      mocks.sharedSpace.addPersonFaces.mockResolvedValue([]);
      mocks.person.getById.mockResolvedValue(personalPerson);
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      const result = await sut.handleSharedSpaceFaceMatch({ spaceId, assetId });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.sharedSpace.createPerson).toHaveBeenCalled();
    });

    it('should skip when no faces are found for the asset', async () => {
      const spaceId = newUuid();
      const assetId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([]);
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      const result = await sut.handleSharedSpaceFaceMatch({ spaceId, assetId });

      expect(result).toBe(JobStatus.Success);
    });

    it('should process multiple faces in a single asset', async () => {
      const spaceId = newUuid();
      const assetId = newUuid();
      const faceId1 = newUuid();
      const faceId2 = newUuid();
      const personId = newUuid();
      const newPersonId = newUuid();
      const personalPersonId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
      const newPerson = factory.sharedSpacePerson({ id: newPersonId, spaceId });
      const personalPerson = factory.person({ id: personalPersonId, name: '' });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
        { id: faceId1, assetId, personId: null, embedding: '[1,2,3]' },
        { id: faceId2, assetId, personId: personalPersonId, embedding: '[4,5,6]' },
      ]);
      mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(false);
      // First face matches existing person, second face creates new person
      mocks.sharedSpace.findClosestSpacePerson
        .mockResolvedValueOnce([{ personId, name: 'Alice', distance: 0.3 }])
        .mockResolvedValueOnce([]);
      mocks.sharedSpace.createPerson.mockResolvedValue(newPerson);
      mocks.sharedSpace.addPersonFaces.mockResolvedValue([]);
      mocks.person.getById.mockResolvedValue(personalPerson);
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      const result = await sut.handleSharedSpaceFaceMatch({ spaceId, assetId });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.sharedSpace.addPersonFaces).toHaveBeenCalledTimes(2);
    });

    it('should copy personal person name when creating a new space person', async () => {
      const spaceId = newUuid();
      const assetId = newUuid();
      const faceId = newUuid();
      const newPersonId = newUuid();
      const personalPersonId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
      const newPerson = factory.sharedSpacePerson({ id: newPersonId, spaceId });
      const personalPerson = factory.person({ id: personalPersonId, name: 'Alice' });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
        { id: faceId, assetId, personId: personalPersonId, embedding: '[1,2,3]' },
      ]);
      mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(false);
      mocks.sharedSpace.findClosestSpacePerson.mockResolvedValue([]);
      mocks.sharedSpace.createPerson.mockResolvedValue(newPerson);
      mocks.sharedSpace.addPersonFaces.mockResolvedValue([]);
      mocks.person.getById.mockResolvedValue(personalPerson);
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      const result = await sut.handleSharedSpaceFaceMatch({ spaceId, assetId });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.person.getById).toHaveBeenCalledWith(personalPersonId);
      expect(mocks.sharedSpace.createPerson).toHaveBeenCalledWith({
        spaceId,
        name: 'Alice',
        representativeFaceId: faceId,
        type: 'person',
      });
    });

    it('should skip face without personId when creating new person', async () => {
      const spaceId = newUuid();
      const assetId = newUuid();
      const faceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
        { id: faceId, assetId, personId: null, embedding: '[1,2,3]' },
      ]);
      mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(false);
      mocks.sharedSpace.findClosestSpacePerson.mockResolvedValue([]);
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      const result = await sut.handleSharedSpaceFaceMatch({ spaceId, assetId });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.sharedSpace.createPerson).not.toHaveBeenCalled();
      expect(mocks.sharedSpace.addPersonFaces).not.toHaveBeenCalled();
    });

    it('should use empty name when personal person has no name', async () => {
      const spaceId = newUuid();
      const assetId = newUuid();
      const faceId = newUuid();
      const newPersonId = newUuid();
      const personalPersonId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
      const newPerson = factory.sharedSpacePerson({ id: newPersonId, spaceId });
      const personalPerson = factory.person({ id: personalPersonId, name: '' });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
        { id: faceId, assetId, personId: personalPersonId, embedding: '[1,2,3]' },
      ]);
      mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(false);
      mocks.sharedSpace.findClosestSpacePerson.mockResolvedValue([]);
      mocks.sharedSpace.createPerson.mockResolvedValue(newPerson);
      mocks.sharedSpace.addPersonFaces.mockResolvedValue([]);
      mocks.person.getById.mockResolvedValue(personalPerson);
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      const result = await sut.handleSharedSpaceFaceMatch({ spaceId, assetId });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.sharedSpace.createPerson).toHaveBeenCalledWith({
        spaceId,
        name: '',
        representativeFaceId: faceId,
        type: 'person',
      });
    });

    it('should set type to pet when creating space person from pet face', async () => {
      const spaceId = newUuid();
      const assetId = newUuid();
      const petFaceId = newUuid();
      const personalPersonId = newUuid();
      const newPersonId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
      const newPerson = factory.sharedSpacePerson({ id: newPersonId, spaceId });
      const personalPerson = factory.person({ id: personalPersonId, name: 'dog' });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([]);
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([{ id: petFaceId, assetId, personId: personalPersonId }]);
      mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(false);
      mocks.sharedSpace.findSpacePersonByLinkedPersonId.mockResolvedValue(void 0);
      mocks.sharedSpace.createPerson.mockResolvedValue(newPerson);
      mocks.sharedSpace.addPersonFaces.mockResolvedValue([]);
      mocks.person.getById.mockResolvedValue(personalPerson);

      await sut.handleSharedSpaceFaceMatch({ spaceId, assetId });

      expect(mocks.sharedSpace.createPerson).toHaveBeenCalledWith(expect.objectContaining({ type: 'pet' }));
    });

    it('should set type to person when creating space person from regular face', async () => {
      const spaceId = newUuid();
      const assetId = newUuid();
      const faceId = newUuid();
      const newPersonId = newUuid();
      const personalPersonId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
      const newPerson = factory.sharedSpacePerson({ id: newPersonId, spaceId });
      const personalPerson = factory.person({ id: personalPersonId, name: 'Alice' });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
        { id: faceId, assetId, personId: personalPersonId, embedding: '[1,2,3]' },
      ]);
      mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(false);
      mocks.sharedSpace.findClosestSpacePerson.mockResolvedValue([]);
      mocks.sharedSpace.createPerson.mockResolvedValue(newPerson);
      mocks.sharedSpace.addPersonFaces.mockResolvedValue([]);
      mocks.person.getById.mockResolvedValue(personalPerson);
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      await sut.handleSharedSpaceFaceMatch({ spaceId, assetId });

      expect(mocks.sharedSpace.createPerson).toHaveBeenCalledWith(expect.objectContaining({ type: 'person' }));
    });
  });

  describe('handleSharedSpaceFaceMatchAll', () => {
    it('should skip when space not found', async () => {
      mocks.sharedSpace.getById.mockResolvedValue(void 0);

      const result = await sut.handleSharedSpaceFaceMatchAll({ spaceId: 'space-1' });

      expect(result).toBe(JobStatus.Skipped);
    });

    it('should skip when face recognition is disabled', async () => {
      const space = factory.sharedSpace({ faceRecognitionEnabled: false });
      mocks.sharedSpace.getById.mockResolvedValue(space);

      const result = await sut.handleSharedSpaceFaceMatchAll({ spaceId: space.id });

      expect(result).toBe(JobStatus.Skipped);
    });

    it('should queue SharedSpaceFaceMatch for each asset in the space', async () => {
      const spaceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAssetIdsInSpace.mockResolvedValue([{ assetId: 'a1' }, { assetId: 'a2' }, { assetId: 'a3' }]);

      const result = await sut.handleSharedSpaceFaceMatchAll({ spaceId });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.SharedSpaceFaceMatch, data: { spaceId, assetId: 'a1' } },
        { name: JobName.SharedSpaceFaceMatch, data: { spaceId, assetId: 'a2' } },
        { name: JobName.SharedSpaceFaceMatch, data: { spaceId, assetId: 'a3' } },
      ]);
    });

    it('should succeed with no assets', async () => {
      const spaceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAssetIdsInSpace.mockResolvedValue([]);

      const result = await sut.handleSharedSpaceFaceMatchAll({ spaceId });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([]);
    });
  });

  describe('handleSharedSpacePersonThumbnail', () => {
    it('should skip when person not found', async () => {
      mocks.sharedSpace.getPersonById.mockResolvedValue(void 0);

      const result = await sut.handleSharedSpacePersonThumbnail({ id: 'person-1' });

      expect(result).toBe(JobStatus.Skipped);
    });

    it('should skip when person has no representative face', async () => {
      const person = factory.sharedSpacePerson({ representativeFaceId: null });
      mocks.sharedSpace.getPersonById.mockResolvedValue(person);

      const result = await sut.handleSharedSpacePersonThumbnail({ id: person.id });

      expect(result).toBe(JobStatus.Skipped);
    });

    it('should copy thumbnail from personal person when available', async () => {
      const personId = newUuid();
      const faceId = newUuid();
      const assetFacePersonId = newUuid();
      const person = factory.sharedSpacePerson({ id: personId, representativeFaceId: faceId });
      const personalPerson = factory.person({
        id: assetFacePersonId,
        thumbnailPath: '/path/to/thumbnail.jpg',
      });

      mocks.sharedSpace.getPersonById.mockResolvedValue(person);
      mocks.person.getFaceById.mockResolvedValue({
        id: faceId,
        personId: assetFacePersonId,
      } as any);
      mocks.person.getById.mockResolvedValue(personalPerson);
      mocks.sharedSpace.updatePerson.mockResolvedValue(
        factory.sharedSpacePerson({ id: personId, thumbnailPath: '/path/to/thumbnail.jpg' }),
      );

      const result = await sut.handleSharedSpacePersonThumbnail({ id: personId });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.sharedSpace.updatePerson).toHaveBeenCalledWith(personId, {
        thumbnailPath: '/path/to/thumbnail.jpg',
      });
    });

    it('should skip when face not found in person repository', async () => {
      const personId = newUuid();
      const faceId = newUuid();
      const person = factory.sharedSpacePerson({ id: personId, representativeFaceId: faceId });

      mocks.sharedSpace.getPersonById.mockResolvedValue(person);
      mocks.person.getFaceById.mockResolvedValue(undefined as any);

      const result = await sut.handleSharedSpacePersonThumbnail({ id: personId });

      expect(result).toBe(JobStatus.Skipped);
    });
  });

  describe('getSpacePeople', () => {
    it('should require membership', async () => {
      mocks.sharedSpace.getMember.mockResolvedValue(void 0);

      await expect(sut.getSpacePeople(factory.auth(), 'space-1')).rejects.toThrow('Not a member');
    });

    it('should return empty array when faceRecognitionEnabled is false', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getById.mockResolvedValue(space);

      const result = await sut.getSpacePeople(auth, spaceId);

      expect(result).toEqual([]);
    });

    it('should return enriched person list with face count, asset count, and alias', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const personId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
      const person = factory.sharedSpacePerson({
        id: personId,
        spaceId,
        name: 'Alice',
        thumbnailPath: '/path/to/thumb.jpg',
      });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([person]);
      mocks.sharedSpace.getPersonFaceCount.mockResolvedValue(5);
      mocks.sharedSpace.getPersonAssetCount.mockResolvedValue(3);
      mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([
        factory.sharedSpacePersonAlias({ personId, userId: auth.user.id, alias: 'My Alice' }),
      ]);

      const result = await sut.getSpacePeople(auth, spaceId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(personId);
      expect(result[0].name).toBe('Alice');
      expect(result[0].faceCount).toBe(5);
      expect(result[0].assetCount).toBe(3);
      expect(result[0].alias).toBe('My Alice');
      expect(result[0].type).toBe('person');
    });

    it('should sort people by asset count descending', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const person1 = factory.sharedSpacePerson({
        id: newUuid(),
        spaceId,
        name: 'Few Photos',
        thumbnailPath: '/path/to/thumb.jpg',
      });
      const person2 = factory.sharedSpacePerson({
        id: newUuid(),
        spaceId,
        name: 'Many Photos',
        thumbnailPath: '/path/to/thumb.jpg',
      });
      const person3 = factory.sharedSpacePerson({
        id: newUuid(),
        spaceId,
        name: 'Some Photos',
        thumbnailPath: '/path/to/thumb.jpg',
      });
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([person1, person2, person3]);
      mocks.sharedSpace.getPersonFaceCount.mockResolvedValue(1);
      mocks.sharedSpace.getPersonAssetCount
        .mockResolvedValueOnce(2) // person1: Few Photos
        .mockResolvedValueOnce(10) // person2: Many Photos
        .mockResolvedValueOnce(5); // person3: Some Photos
      mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);

      const result = await sut.getSpacePeople(auth, spaceId);

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Many Photos');
      expect(result[0].assetCount).toBe(10);
      expect(result[1].name).toBe('Some Photos');
      expect(result[1].assetCount).toBe(5);
      expect(result[2].name).toBe('Few Photos');
      expect(result[2].assetCount).toBe(2);
    });

    it('should exclude people without thumbnails', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
      const personWithThumb = factory.sharedSpacePerson({
        id: newUuid(),
        spaceId,
        name: 'Has Thumb',
        thumbnailPath: '/path/to/thumb.jpg',
      });
      const personWithoutThumb = factory.sharedSpacePerson({
        id: newUuid(),
        spaceId,
        name: 'No Thumb',
        thumbnailPath: '',
      });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([personWithThumb, personWithoutThumb]);
      mocks.sharedSpace.getPersonFaceCount.mockResolvedValue(1);
      mocks.sharedSpace.getPersonAssetCount.mockResolvedValue(1);
      mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);

      const result = await sut.getSpacePeople(auth, spaceId);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Has Thumb');
    });

    it('should filter out pets when petsEnabled is false', async () => {
      const spaceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true, petsEnabled: false });
      const humanPerson = factory.sharedSpacePerson({ spaceId, thumbnailPath: '/thumb.jpg', type: 'person' });
      const petPerson = factory.sharedSpacePerson({ spaceId, thumbnailPath: '/pet.jpg', type: 'pet' });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([humanPerson, petPerson]);
      mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);
      mocks.sharedSpace.getPersonFaceCount.mockResolvedValue(1);
      mocks.sharedSpace.getPersonAssetCount.mockResolvedValue(1);

      const result = await sut.getSpacePeople(factory.auth(), spaceId);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('person');
    });

    it('should include pets when petsEnabled is true', async () => {
      const spaceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true, petsEnabled: true });
      const humanPerson = factory.sharedSpacePerson({ spaceId, thumbnailPath: '/thumb.jpg', type: 'person' });
      const petPerson = factory.sharedSpacePerson({ spaceId, thumbnailPath: '/pet.jpg', type: 'pet' });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([humanPerson, petPerson]);
      mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);
      mocks.sharedSpace.getPersonFaceCount.mockResolvedValue(1);
      mocks.sharedSpace.getPersonAssetCount.mockResolvedValue(1);

      const result = await sut.getSpacePeople(factory.auth(), spaceId);

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.type)).toEqual(expect.arrayContaining(['person', 'pet']));
    });
  });

  describe('getSpacePerson', () => {
    it('should require membership', async () => {
      mocks.sharedSpace.getMember.mockResolvedValue(void 0);

      await expect(sut.getSpacePerson(factory.auth(), 'space-1', 'person-1')).rejects.toThrow('Not a member');
    });

    it('should throw when person not found', async () => {
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getPersonById.mockResolvedValue(void 0);

      await expect(sut.getSpacePerson(factory.auth(), 'space-1', 'person-1')).rejects.toThrow('Person not found');
    });

    it('should throw when person belongs to different space', async () => {
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getPersonById.mockResolvedValue(factory.sharedSpacePerson({ spaceId: 'other-space' }));

      await expect(sut.getSpacePerson(factory.auth(), 'space-1', 'person-1')).rejects.toThrow('Person not found');
    });

    it('should return enriched person', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const personId = newUuid();
      const person = factory.sharedSpacePerson({ id: personId, spaceId, name: 'Bob' });
      const space = factory.sharedSpace({ id: spaceId });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getPersonById.mockResolvedValue(person);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getPersonFaceCount.mockResolvedValue(10);
      mocks.sharedSpace.getPersonAssetCount.mockResolvedValue(7);
      mocks.sharedSpace.getAlias.mockResolvedValue(void 0);

      const result = await sut.getSpacePerson(auth, spaceId, personId);

      expect(result.id).toBe(personId);
      expect(result.name).toBe('Bob');
      expect(result.faceCount).toBe(10);
      expect(result.assetCount).toBe(7);
      expect(result.alias).toBeNull();
    });

    it('should reject access to pet person when petsEnabled is false', async () => {
      const spaceId = newUuid();
      const personId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true, petsEnabled: false });
      const person = factory.sharedSpacePerson({ id: personId, spaceId, type: 'pet' });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ spaceId }));
      mocks.sharedSpace.getPersonById.mockResolvedValue(person);
      mocks.sharedSpace.getById.mockResolvedValue(space);

      await expect(sut.getSpacePerson(factory.auth(), spaceId, personId)).rejects.toThrow('Person not found');
    });
  });

  describe('getSpacePersonThumbnail', () => {
    it('should require membership', async () => {
      mocks.sharedSpace.getMember.mockResolvedValue(void 0);

      await expect(sut.getSpacePersonThumbnail(factory.auth(), 'space-1', 'person-1')).rejects.toThrow('Not a member');
    });

    it('should throw NotFoundException when person not found', async () => {
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getPersonById.mockResolvedValue(void 0);

      await expect(sut.getSpacePersonThumbnail(factory.auth(), 'space-1', 'person-1')).rejects.toThrow('Not Found');
    });

    it('should throw NotFoundException when person has no thumbnail', async () => {
      const spaceId = newUuid();
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getPersonById.mockResolvedValue(
        factory.sharedSpacePerson({ spaceId, thumbnailPath: '', representativeFaceId: null }),
      );

      await expect(sut.getSpacePersonThumbnail(factory.auth(), spaceId, 'person-1')).rejects.toThrow('Not Found');
    });

    it('should fall back to personal person thumbnail when space person has no thumbnail', async () => {
      const spaceId = newUuid();
      const personId = newUuid();
      const faceId = newUuid();
      const personalPersonId = newUuid();
      const personalPerson = factory.person({ id: personalPersonId, thumbnailPath: '/path/to/thumbnail.jpg' });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getPersonById.mockResolvedValue(
        factory.sharedSpacePerson({ id: personId, spaceId, thumbnailPath: '', representativeFaceId: faceId }),
      );
      mocks.person.getFaceById.mockResolvedValue({ id: faceId, personId: personalPersonId } as any);
      mocks.person.getById.mockResolvedValue(personalPerson);
      mocks.sharedSpace.updatePerson.mockResolvedValue(
        factory.sharedSpacePerson({ id: personId, thumbnailPath: '/path/to/thumbnail.jpg' }),
      );
      vi.spyOn(sut as any, 'serveFromBackend').mockResolvedValue({} as any);

      await expect(sut.getSpacePersonThumbnail(factory.auth(), spaceId, personId)).resolves.toBeDefined();

      expect(mocks.sharedSpace.updatePerson).toHaveBeenCalledWith(personId, {
        thumbnailPath: '/path/to/thumbnail.jpg',
      });
    });

    it('should throw NotFoundException when fallback face has no personId', async () => {
      const spaceId = newUuid();
      const faceId = newUuid();

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getPersonById.mockResolvedValue(
        factory.sharedSpacePerson({ spaceId, thumbnailPath: '', representativeFaceId: faceId }),
      );
      mocks.person.getFaceById.mockResolvedValue({ id: faceId, personId: null } as any);

      await expect(sut.getSpacePersonThumbnail(factory.auth(), spaceId, 'person-1')).rejects.toThrow('Not Found');
    });

    it('should throw NotFoundException when fallback personal person has no thumbnail', async () => {
      const spaceId = newUuid();
      const faceId = newUuid();
      const personalPersonId = newUuid();

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getPersonById.mockResolvedValue(
        factory.sharedSpacePerson({ spaceId, thumbnailPath: '', representativeFaceId: faceId }),
      );
      mocks.person.getFaceById.mockResolvedValue({ id: faceId, personId: personalPersonId } as any);
      mocks.person.getById.mockResolvedValue(factory.person({ id: personalPersonId, thumbnailPath: '' }));

      await expect(sut.getSpacePersonThumbnail(factory.auth(), spaceId, 'person-1')).rejects.toThrow('Not Found');
    });

    it('should throw NotFoundException when person belongs to different space', async () => {
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getPersonById.mockResolvedValue(
        factory.sharedSpacePerson({ spaceId: 'other-space', thumbnailPath: '/path/to/thumb.jpg' }),
      );

      await expect(sut.getSpacePersonThumbnail(factory.auth(), 'space-1', 'person-1')).rejects.toThrow('Not Found');
    });
  });

  describe('updateSpacePerson', () => {
    it('should require editor role', async () => {
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));

      await expect(sut.updateSpacePerson(factory.auth(), 'space-1', 'person-1', { name: 'New Name' })).rejects.toThrow(
        'Insufficient role',
      );
    });

    it('should throw when person not found', async () => {
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
      mocks.sharedSpace.getPersonById.mockResolvedValue(void 0);

      await expect(sut.updateSpacePerson(factory.auth(), 'space-1', 'person-1', { name: 'New Name' })).rejects.toThrow(
        'Person not found',
      );
    });

    it('should update person name', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const personId = newUuid();
      const person = factory.sharedSpacePerson({ id: personId, spaceId });
      const updatedPerson = factory.sharedSpacePerson({ id: personId, spaceId, name: 'New Name' });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
      mocks.sharedSpace.getPersonById.mockResolvedValue(person);
      mocks.sharedSpace.updatePerson.mockResolvedValue(updatedPerson);
      mocks.sharedSpace.getPersonFaceCount.mockResolvedValue(5);
      mocks.sharedSpace.getPersonAssetCount.mockResolvedValue(3);
      mocks.sharedSpace.getAlias.mockResolvedValue(void 0);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      const result = await sut.updateSpacePerson(auth, spaceId, personId, { name: 'New Name' });

      expect(result.name).toBe('New Name');
      expect(mocks.sharedSpace.updatePerson).toHaveBeenCalledWith(personId, { name: 'New Name' });
    });

    it('should reject representativeFaceId that does not belong to an asset in the space', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const personId = newUuid();
      const foreignFaceId = newUuid();
      const person = factory.sharedSpacePerson({ id: personId, spaceId });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
      mocks.sharedSpace.getPersonById.mockResolvedValue(person);
      mocks.sharedSpace.isFaceInSpace.mockResolvedValue(false);

      await expect(
        sut.updateSpacePerson(auth, spaceId, personId, { representativeFaceId: foreignFaceId }),
      ).rejects.toThrow('Representative face must belong to an asset in the space');

      expect(mocks.sharedSpace.updatePerson).not.toHaveBeenCalled();
    });

    it('should allow representativeFaceId that belongs to an asset in the space', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const personId = newUuid();
      const faceId = newUuid();
      const person = factory.sharedSpacePerson({ id: personId, spaceId });
      const updatedPerson = factory.sharedSpacePerson({ id: personId, spaceId, representativeFaceId: faceId });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
      mocks.sharedSpace.getPersonById.mockResolvedValue(person);
      mocks.sharedSpace.isFaceInSpace.mockResolvedValue(true);
      mocks.sharedSpace.updatePerson.mockResolvedValue(updatedPerson);
      mocks.sharedSpace.getPersonFaceCount.mockResolvedValue(5);
      mocks.sharedSpace.getPersonAssetCount.mockResolvedValue(3);
      mocks.sharedSpace.getAlias.mockResolvedValue(void 0);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      const result = await sut.updateSpacePerson(auth, spaceId, personId, { representativeFaceId: faceId });

      expect(result.representativeFaceId).toBe(faceId);
      expect(mocks.sharedSpace.isFaceInSpace).toHaveBeenCalledWith(spaceId, faceId);
    });

    it('should log activity when updating a person', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const personId = newUuid();
      const person = factory.sharedSpacePerson({ id: personId, spaceId });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
      mocks.sharedSpace.getPersonById.mockResolvedValue(person);
      mocks.sharedSpace.updatePerson.mockResolvedValue(person);
      mocks.sharedSpace.getPersonFaceCount.mockResolvedValue(5);
      mocks.sharedSpace.getPersonAssetCount.mockResolvedValue(3);
      mocks.sharedSpace.getAlias.mockResolvedValue(void 0);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.updateSpacePerson(auth, spaceId, personId, { name: 'New Name' });

      expect(mocks.sharedSpace.logActivity).toHaveBeenCalledWith({
        spaceId,
        userId: auth.user.id,
        type: SharedSpaceActivityType.PersonUpdate,
        data: { personId },
      });
    });
  });

  describe('deleteSpacePerson', () => {
    it('should require editor role', async () => {
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));

      await expect(sut.deleteSpacePerson(factory.auth(), 'space-1', 'person-1')).rejects.toThrow('Insufficient role');
    });

    it('should throw when person not found', async () => {
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
      mocks.sharedSpace.getPersonById.mockResolvedValue(void 0);

      await expect(sut.deleteSpacePerson(factory.auth(), 'space-1', 'person-1')).rejects.toThrow('Person not found');
    });

    it('should delete person', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const personId = newUuid();
      const person = factory.sharedSpacePerson({ id: personId, spaceId });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
      mocks.sharedSpace.getPersonById.mockResolvedValue(person);
      mocks.sharedSpace.deletePerson.mockResolvedValue(void 0);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.deleteSpacePerson(auth, spaceId, personId);

      expect(mocks.sharedSpace.deletePerson).toHaveBeenCalledWith(personId);
    });

    it('should log activity when deleting a person', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const personId = newUuid();
      const person = factory.sharedSpacePerson({ id: personId, spaceId, name: 'Alice' });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
      mocks.sharedSpace.getPersonById.mockResolvedValue(person);
      mocks.sharedSpace.deletePerson.mockResolvedValue(void 0);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.deleteSpacePerson(auth, spaceId, personId);

      expect(mocks.sharedSpace.logActivity).toHaveBeenCalledWith({
        spaceId,
        userId: auth.user.id,
        type: SharedSpaceActivityType.PersonDelete,
        data: { personId, personName: 'Alice' },
      });
    });
  });

  describe('mergeSpacePeople', () => {
    it('should require editor role', async () => {
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));

      await expect(
        sut.mergeSpacePeople(factory.auth(), 'space-1', 'target-person', { ids: ['source-person'] }),
      ).rejects.toThrow('Insufficient role');
    });

    it('should throw when target person not found', async () => {
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
      mocks.sharedSpace.getPersonById.mockResolvedValue(void 0);

      await expect(
        sut.mergeSpacePeople(factory.auth(), 'space-1', 'target-person', { ids: ['source-person'] }),
      ).rejects.toThrow('Person not found');
    });

    it('should throw when merging a person into itself', async () => {
      const spaceId = newUuid();
      const personId = newUuid();
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
      mocks.sharedSpace.getPersonById.mockResolvedValue(factory.sharedSpacePerson({ id: personId, spaceId }));

      await expect(sut.mergeSpacePeople(factory.auth(), spaceId, personId, { ids: [personId] })).rejects.toThrow(
        'Cannot merge a person into themselves',
      );
    });

    it('should merge source persons into target', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const targetId = newUuid();
      const sourceId = newUuid();
      const target = factory.sharedSpacePerson({ id: targetId, spaceId });
      const source = factory.sharedSpacePerson({ id: sourceId, spaceId });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
      mocks.sharedSpace.getPersonById
        .mockResolvedValueOnce(target) // target lookup
        .mockResolvedValueOnce(source); // source lookup
      mocks.sharedSpace.reassignPersonFaces.mockResolvedValue(void 0);
      mocks.sharedSpace.deletePerson.mockResolvedValue(void 0);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.mergeSpacePeople(auth, spaceId, targetId, { ids: [sourceId] });

      expect(mocks.sharedSpace.reassignPersonFaces).toHaveBeenCalledWith(sourceId, targetId);
      expect(mocks.sharedSpace.deletePerson).toHaveBeenCalledWith(sourceId);
    });

    it('should throw when a source person does not belong to the space', async () => {
      const spaceId = newUuid();
      const targetId = newUuid();
      const validSourceId = newUuid();
      const invalidSourceId = newUuid();
      const target = factory.sharedSpacePerson({ id: targetId, spaceId });
      const validSource = factory.sharedSpacePerson({ id: validSourceId, spaceId });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
      mocks.sharedSpace.getPersonById
        .mockResolvedValueOnce(target)
        .mockResolvedValueOnce(validSource)
        .mockResolvedValueOnce(void 0);

      await expect(
        sut.mergeSpacePeople(factory.auth(), spaceId, targetId, { ids: [validSourceId, invalidSourceId] }),
      ).rejects.toThrow(BadRequestException);

      expect(mocks.sharedSpace.reassignPersonFaces).not.toHaveBeenCalled();
      expect(mocks.sharedSpace.deletePerson).not.toHaveBeenCalled();
    });

    it('should throw when a source person belongs to a different space', async () => {
      const spaceId = newUuid();
      const otherSpaceId = newUuid();
      const targetId = newUuid();
      const sourceId = newUuid();
      const target = factory.sharedSpacePerson({ id: targetId, spaceId });
      const wrongSpaceSource = factory.sharedSpacePerson({ id: sourceId, spaceId: otherSpaceId });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
      mocks.sharedSpace.getPersonById.mockResolvedValueOnce(target).mockResolvedValueOnce(wrongSpaceSource);

      await expect(sut.mergeSpacePeople(factory.auth(), spaceId, targetId, { ids: [sourceId] })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should log activity when merging people', async () => {
      const spaceId = newUuid();
      const targetId = newUuid();
      const sourceId = newUuid();
      const target = factory.sharedSpacePerson({ id: targetId, spaceId });
      const source = factory.sharedSpacePerson({ id: sourceId, spaceId });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
      mocks.sharedSpace.getPersonById.mockResolvedValueOnce(target).mockResolvedValueOnce(source);
      mocks.sharedSpace.reassignPersonFaces.mockResolvedValue(void 0);
      mocks.sharedSpace.deletePerson.mockResolvedValue(void 0);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.mergeSpacePeople(factory.auth(), spaceId, targetId, { ids: [sourceId] });

      expect(mocks.sharedSpace.logActivity).toHaveBeenCalledWith({
        spaceId,
        userId: expect.any(String),
        type: SharedSpaceActivityType.PersonMerge,
        data: { targetPersonId: targetId, mergedCount: 1 },
      });
    });

    it('should reject merging across different types', async () => {
      const spaceId = newUuid();
      const targetId = newUuid();
      const sourceId = newUuid();
      const target = factory.sharedSpacePerson({ id: targetId, spaceId, type: 'person' });
      const source = factory.sharedSpacePerson({ id: sourceId, spaceId, type: 'pet' });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ spaceId, role: SharedSpaceRole.Editor }));
      mocks.sharedSpace.getPersonById.mockResolvedValueOnce(target).mockResolvedValueOnce(source);

      await expect(sut.mergeSpacePeople(factory.auth(), spaceId, targetId, { ids: [sourceId] })).rejects.toThrow(
        'Cannot merge people of different types',
      );
    });

    it('should reject merging pet into person (reverse direction)', async () => {
      const spaceId = newUuid();
      const targetId = newUuid();
      const sourceId = newUuid();
      const target = factory.sharedSpacePerson({ id: targetId, spaceId, type: 'pet' });
      const source = factory.sharedSpacePerson({ id: sourceId, spaceId, type: 'person' });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ spaceId, role: SharedSpaceRole.Editor }));
      mocks.sharedSpace.getPersonById.mockResolvedValueOnce(target).mockResolvedValueOnce(source);

      await expect(sut.mergeSpacePeople(factory.auth(), spaceId, targetId, { ids: [sourceId] })).rejects.toThrow(
        'Cannot merge people of different types',
      );
    });
  });

  describe('setSpacePersonAlias', () => {
    it('should require membership', async () => {
      mocks.sharedSpace.getMember.mockResolvedValue(void 0);

      await expect(sut.setSpacePersonAlias(factory.auth(), 'space-1', 'person-1', { alias: 'Nick' })).rejects.toThrow(
        'Not a member',
      );
    });

    it('should throw when person not found', async () => {
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getPersonById.mockResolvedValue(void 0);

      await expect(sut.setSpacePersonAlias(factory.auth(), 'space-1', 'person-1', { alias: 'Nick' })).rejects.toThrow(
        'Person not found',
      );
    });

    it('should upsert alias for user', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const personId = newUuid();
      const person = factory.sharedSpacePerson({ id: personId, spaceId });
      const aliasResult = factory.sharedSpacePersonAlias({ personId, userId: auth.user.id, alias: 'Nick' });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getPersonById.mockResolvedValue(person);
      mocks.sharedSpace.upsertAlias.mockResolvedValue(aliasResult);

      await sut.setSpacePersonAlias(auth, spaceId, personId, { alias: 'Nick' });

      expect(mocks.sharedSpace.upsertAlias).toHaveBeenCalledWith({
        personId,
        userId: auth.user.id,
        alias: 'Nick',
      });
    });
  });

  describe('deleteSpacePersonAlias', () => {
    it('should require membership', async () => {
      mocks.sharedSpace.getMember.mockResolvedValue(void 0);

      await expect(sut.deleteSpacePersonAlias(factory.auth(), 'space-1', 'person-1')).rejects.toThrow('Not a member');
    });

    it('should delete alias for user', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const personId = newUuid();

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.deleteAlias.mockResolvedValue(void 0);

      await sut.deleteSpacePersonAlias(auth, spaceId, personId);

      expect(mocks.sharedSpace.deleteAlias).toHaveBeenCalledWith(personId, auth.user.id);
    });
  });

  describe('getSpacePersonAssets', () => {
    it('should require membership', async () => {
      mocks.sharedSpace.getMember.mockResolvedValue(void 0);

      await expect(sut.getSpacePersonAssets(factory.auth(), 'space-1', 'person-1')).rejects.toThrow('Not a member');
    });

    it('should throw when person not found', async () => {
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getPersonById.mockResolvedValue(void 0);

      await expect(sut.getSpacePersonAssets(factory.auth(), 'space-1', 'person-1')).rejects.toThrow('Person not found');
    });

    it('should return asset IDs for the person', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const personId = newUuid();
      const person = factory.sharedSpacePerson({ id: personId, spaceId });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getPersonById.mockResolvedValue(person);
      mocks.sharedSpace.getPersonAssetIds.mockResolvedValue([{ assetId: 'a1' }, { assetId: 'a2' }]);

      const result = await sut.getSpacePersonAssets(auth, spaceId, personId);

      expect(result).toEqual(['a1', 'a2']);
    });
  });

  describe('response mapping', () => {
    it('should return ISO 8601 strings for member joinedAt', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const joinedDate = new Date('2024-06-15T10:30:00.000Z');
      const space = factory.sharedSpace({ id: spaceId });

      mocks.sharedSpace.getAllByUserId.mockResolvedValue([space]);
      mocks.sharedSpace.getMembers.mockResolvedValue([
        makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Owner, joinedAt: joinedDate }),
      ]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(0);
      mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ lastViewedAt: null }));

      const result = await sut.getAll(auth);

      expect(result[0]!.members![0]!.joinedAt).toBe('2024-06-15T10:30:00.000Z');
      expect(typeof result[0]!.members![0]!.joinedAt).toBe('string');
    });

    it('should return ISO 8601 strings for space createdAt', async () => {
      const auth = factory.auth();
      const createdDate = new Date('2024-01-01T00:00:00.000Z');
      const space = factory.sharedSpace({ createdAt: createdDate });

      mocks.sharedSpace.getAllByUserId.mockResolvedValue([space]);
      mocks.sharedSpace.getMembers.mockResolvedValue([
        makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Owner }),
      ]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(0);
      mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ lastViewedAt: null }));

      const result = await sut.getAll(auth);

      expect(result[0]!.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(typeof result[0]!.createdAt).toBe('string');
    });
  });

  describe('getAssetCount (with library-linked assets)', () => {
    it('should call repository getAssetCount which includes library assets', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace();
      const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getMembers.mockResolvedValue([member]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(117_000);
      mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);
      mocks.sharedSpace.getNewAssetCount.mockResolvedValue(0);

      const result = await sut.get(auth, space.id);

      expect(result.assetCount).toBe(117_000);
      expect(mocks.sharedSpace.getAssetCount).toHaveBeenCalledWith(space.id);
    });
  });

  describe('isAssetInSpace (with library-linked assets)', () => {
    it('should validate thumbnail from library-linked asset', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace();
      const member = makeMemberResult({
        spaceId: space.id,
        userId: auth.user.id,
        role: SharedSpaceRole.Owner,
      });
      const thumbnailAssetId = newUuid();

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.isAssetInSpace.mockResolvedValue(true);
      mocks.sharedSpace.update.mockResolvedValue(space);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0 as any);

      await sut.update(auth, space.id, { thumbnailAssetId });

      expect(mocks.sharedSpace.isAssetInSpace).toHaveBeenCalledWith(space.id, thumbnailAssetId);
    });

    it('should reject thumbnail not in space or linked library', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace();
      const member = makeMemberResult({
        spaceId: space.id,
        userId: auth.user.id,
        role: SharedSpaceRole.Owner,
      });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.isAssetInSpace.mockResolvedValue(false);

      await expect(sut.update(auth, space.id, { thumbnailAssetId: newUuid() })).rejects.toThrow(BadRequestException);
    });
  });

  describe('linkLibrary', () => {
    it('should link a library when user is admin and space owner', async () => {
      const auth = factory.auth({ user: { isAdmin: true } });
      const space = factory.sharedSpace();
      const library = factory.library();
      const member = makeMemberResult({
        spaceId: space.id,
        userId: auth.user.id,
        role: SharedSpaceRole.Owner,
      });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.library.get.mockResolvedValue(library);
      mocks.sharedSpace.addLibrary.mockResolvedValue(
        factory.sharedSpaceLibrary({ spaceId: space.id, libraryId: library.id }),
      );

      await sut.linkLibrary(auth, space.id, { libraryId: library.id });

      expect(mocks.sharedSpace.addLibrary).toHaveBeenCalledWith({
        spaceId: space.id,
        libraryId: library.id,
        addedById: auth.user.id,
      });
    });

    it('should link a library when user is admin and space editor', async () => {
      const auth = factory.auth({ user: { isAdmin: true } });
      const space = factory.sharedSpace();
      const library = factory.library();
      const member = makeMemberResult({
        spaceId: space.id,
        userId: auth.user.id,
        role: SharedSpaceRole.Editor,
      });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.library.get.mockResolvedValue(library);
      mocks.sharedSpace.addLibrary.mockResolvedValue(
        factory.sharedSpaceLibrary({ spaceId: space.id, libraryId: library.id }),
      );

      await sut.linkLibrary(auth, space.id, { libraryId: library.id });

      expect(mocks.sharedSpace.addLibrary).toHaveBeenCalled();
    });

    it('should reject when user is not admin', async () => {
      const auth = factory.auth({ user: { isAdmin: false } });
      const space = factory.sharedSpace();

      await expect(sut.linkLibrary(auth, space.id, { libraryId: newUuid() })).rejects.toThrow(ForbiddenException);
    });

    it('should reject when user is admin but only a viewer', async () => {
      const auth = factory.auth({ user: { isAdmin: true } });
      const space = factory.sharedSpace();
      const member = makeMemberResult({
        spaceId: space.id,
        userId: auth.user.id,
        role: SharedSpaceRole.Viewer,
      });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMember.mockResolvedValue(member);

      await expect(sut.linkLibrary(auth, space.id, { libraryId: newUuid() })).rejects.toThrow(ForbiddenException);
    });

    it('should reject when user is admin but not a space member', async () => {
      const auth = factory.auth({ user: { isAdmin: true } });
      const space = factory.sharedSpace();

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMember.mockResolvedValue(void 0);

      await expect(sut.linkLibrary(auth, space.id, { libraryId: newUuid() })).rejects.toThrow(ForbiddenException);
    });

    it('should reject linking a non-existent library', async () => {
      const auth = factory.auth({ user: { isAdmin: true } });
      const space = factory.sharedSpace();
      const member = makeMemberResult({
        spaceId: space.id,
        userId: auth.user.id,
        role: SharedSpaceRole.Owner,
      });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.library.get.mockResolvedValue(void 0);

      await expect(sut.linkLibrary(auth, space.id, { libraryId: newUuid() })).rejects.toThrow(BadRequestException);
    });

    it('should reject linking to a non-existent space', async () => {
      const auth = factory.auth({ user: { isAdmin: true } });

      mocks.sharedSpace.getById.mockResolvedValue(void 0);

      await expect(sut.linkLibrary(auth, newUuid(), { libraryId: newUuid() })).rejects.toThrow();
    });

    it('should silently no-op when linking the same library twice', async () => {
      const auth = factory.auth({ user: { isAdmin: true } });
      const space = factory.sharedSpace({ faceRecognitionEnabled: true });
      const library = factory.library();
      const member = makeMemberResult({
        spaceId: space.id,
        userId: auth.user.id,
        role: SharedSpaceRole.Owner,
      });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.library.get.mockResolvedValue(library);
      mocks.sharedSpace.addLibrary.mockResolvedValue(void 0 as any);

      await expect(sut.linkLibrary(auth, space.id, { libraryId: library.id })).resolves.not.toThrow();

      expect(mocks.job.queue).not.toHaveBeenCalledWith(
        expect.objectContaining({ name: JobName.SharedSpaceLibraryFaceSync }),
      );
    });

    it('should allow linking the same library to different spaces', async () => {
      const auth = factory.auth({ user: { isAdmin: true } });
      const space1 = factory.sharedSpace();
      const space2 = factory.sharedSpace();
      const library = factory.library();

      for (const space of [space1, space2]) {
        const member = makeMemberResult({
          spaceId: space.id,
          userId: auth.user.id,
          role: SharedSpaceRole.Owner,
        });

        mocks.sharedSpace.getById.mockResolvedValue(space);
        mocks.sharedSpace.getMember.mockResolvedValue(member);
        mocks.library.get.mockResolvedValue(library);
        mocks.sharedSpace.addLibrary.mockResolvedValue(
          factory.sharedSpaceLibrary({ spaceId: space.id, libraryId: library.id }),
        );

        await sut.linkLibrary(auth, space.id, { libraryId: library.id });
      }

      expect(mocks.sharedSpace.addLibrary).toHaveBeenCalledTimes(2);
    });

    it('should allow linking different libraries to the same space', async () => {
      const auth = factory.auth({ user: { isAdmin: true } });
      const space = factory.sharedSpace();
      const lib1 = factory.library();
      const lib2 = factory.library();
      const member = makeMemberResult({
        spaceId: space.id,
        userId: auth.user.id,
        role: SharedSpaceRole.Owner,
      });

      for (const lib of [lib1, lib2]) {
        mocks.sharedSpace.getById.mockResolvedValue(space);
        mocks.sharedSpace.getMember.mockResolvedValue(member);
        mocks.library.get.mockResolvedValue(lib);
        mocks.sharedSpace.addLibrary.mockResolvedValue(
          factory.sharedSpaceLibrary({ spaceId: space.id, libraryId: lib.id }),
        );

        await sut.linkLibrary(auth, space.id, { libraryId: lib.id });
      }

      expect(mocks.sharedSpace.addLibrary).toHaveBeenCalledTimes(2);
    });

    it('should queue face sync job when space has face recognition enabled', async () => {
      const auth = factory.auth({ user: { isAdmin: true } });
      const space = factory.sharedSpace({ faceRecognitionEnabled: true });
      const library = factory.library();
      const member = makeMemberResult({
        spaceId: space.id,
        userId: auth.user.id,
        role: SharedSpaceRole.Owner,
      });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.library.get.mockResolvedValue(library);
      mocks.sharedSpace.addLibrary.mockResolvedValue(
        factory.sharedSpaceLibrary({ spaceId: space.id, libraryId: library.id }),
      );

      await sut.linkLibrary(auth, space.id, { libraryId: library.id });

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.SharedSpaceLibraryFaceSync,
        data: { spaceId: space.id, libraryId: library.id },
      });
    });

    it('should not queue face sync job when face recognition is disabled', async () => {
      const auth = factory.auth({ user: { isAdmin: true } });
      const space = factory.sharedSpace({ faceRecognitionEnabled: false });
      const library = factory.library();
      const member = makeMemberResult({
        spaceId: space.id,
        userId: auth.user.id,
        role: SharedSpaceRole.Owner,
      });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.library.get.mockResolvedValue(library);
      mocks.sharedSpace.addLibrary.mockResolvedValue(
        factory.sharedSpaceLibrary({ spaceId: space.id, libraryId: library.id }),
      );

      await sut.linkLibrary(auth, space.id, { libraryId: library.id });

      expect(mocks.job.queue).not.toHaveBeenCalledWith(
        expect.objectContaining({ name: JobName.SharedSpaceLibraryFaceSync }),
      );
    });
  });

  describe('unlinkLibrary', () => {
    it('should unlink a library when user is admin and space owner', async () => {
      const auth = factory.auth({ user: { isAdmin: true } });
      const space = factory.sharedSpace();
      const libraryId = newUuid();
      const member = makeMemberResult({
        spaceId: space.id,
        userId: auth.user.id,
        role: SharedSpaceRole.Owner,
      });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.removeLibrary.mockResolvedValue([] as any);

      await sut.unlinkLibrary(auth, space.id, libraryId);

      expect(mocks.sharedSpace.removeLibrary).toHaveBeenCalledWith(space.id, libraryId);
    });

    it('should unlink a library when user is admin and space editor', async () => {
      const auth = factory.auth({ user: { isAdmin: true } });
      const space = factory.sharedSpace();
      const libraryId = newUuid();
      const member = makeMemberResult({
        spaceId: space.id,
        userId: auth.user.id,
        role: SharedSpaceRole.Editor,
      });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.removeLibrary.mockResolvedValue([] as any);

      await sut.unlinkLibrary(auth, space.id, libraryId);

      expect(mocks.sharedSpace.removeLibrary).toHaveBeenCalledWith(space.id, libraryId);
    });

    it('should reject when user is not admin', async () => {
      const auth = factory.auth({ user: { isAdmin: false } });

      await expect(sut.unlinkLibrary(auth, newUuid(), newUuid())).rejects.toThrow(ForbiddenException);
    });

    it('should reject when user is admin but only a viewer', async () => {
      const auth = factory.auth({ user: { isAdmin: true } });
      const space = factory.sharedSpace();
      const member = makeMemberResult({
        spaceId: space.id,
        userId: auth.user.id,
        role: SharedSpaceRole.Viewer,
      });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMember.mockResolvedValue(member);

      await expect(sut.unlinkLibrary(auth, space.id, newUuid())).rejects.toThrow(ForbiddenException);
    });

    it('should reject when user is admin but not a space member', async () => {
      const auth = factory.auth({ user: { isAdmin: true } });
      const space = factory.sharedSpace();

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMember.mockResolvedValue(void 0);

      await expect(sut.unlinkLibrary(auth, space.id, newUuid())).rejects.toThrow(ForbiddenException);
    });

    it('should not fail when unlinking a library that is not linked', async () => {
      const auth = factory.auth({ user: { isAdmin: true } });
      const space = factory.sharedSpace();
      const member = makeMemberResult({
        spaceId: space.id,
        userId: auth.user.id,
        role: SharedSpaceRole.Owner,
      });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.removeLibrary.mockResolvedValue([] as any);

      await expect(sut.unlinkLibrary(auth, space.id, newUuid())).resolves.not.toThrow();
    });

    it('should not remove manually added assets from the same library', async () => {
      const auth = factory.auth({ user: { isAdmin: true } });
      const space = factory.sharedSpace();
      const member = makeMemberResult({
        spaceId: space.id,
        userId: auth.user.id,
        role: SharedSpaceRole.Owner,
      });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.removeLibrary.mockResolvedValue([] as any);

      await sut.unlinkLibrary(auth, space.id, newUuid());

      expect(mocks.sharedSpace.removeLibrary).toHaveBeenCalled();
      expect(mocks.sharedSpace.removeAssets).not.toHaveBeenCalled();
    });
  });

  describe('get (linked libraries)', () => {
    it('should include linked libraries in response when user is admin', async () => {
      const auth = factory.auth({ user: { isAdmin: true } });
      const space = factory.sharedSpace();
      const member = makeMemberResult({
        spaceId: space.id,
        userId: auth.user.id,
        role: SharedSpaceRole.Owner,
      });
      const linkedLibrary = factory.sharedSpaceLibrary({
        spaceId: space.id,
        libraryId: newUuid(),
      });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getMembers.mockResolvedValue([member]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(100);
      mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);
      mocks.sharedSpace.getNewAssetCount.mockResolvedValue(0);
      mocks.sharedSpace.getLinkedLibraries.mockResolvedValue([linkedLibrary]);
      mocks.library.get.mockResolvedValue(factory.library({ id: linkedLibrary.libraryId, name: 'Family Photos' }));

      const result = await sut.get(auth, space.id);

      expect(result.linkedLibraries).toHaveLength(1);
      expect(result.linkedLibraries![0].libraryId).toBe(linkedLibrary.libraryId);
      expect(result.linkedLibraries![0].libraryName).toBe('Family Photos');
    });

    it('should not include linked libraries for non-admin users', async () => {
      const auth = factory.auth({ user: { isAdmin: false } });
      const space = factory.sharedSpace();
      const member = makeMemberResult({
        spaceId: space.id,
        userId: auth.user.id,
        role: SharedSpaceRole.Owner,
      });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getMembers.mockResolvedValue([member]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(0);
      mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);
      mocks.sharedSpace.getNewAssetCount.mockResolvedValue(0);

      const result = await sut.get(auth, space.id);

      expect(result.linkedLibraries).toBeUndefined();
      expect(mocks.sharedSpace.getLinkedLibraries).not.toHaveBeenCalled();
    });

    it('should return empty linkedLibraries array for admin with no links', async () => {
      const auth = factory.auth({ user: { isAdmin: true } });
      const space = factory.sharedSpace();
      const member = makeMemberResult({
        spaceId: space.id,
        userId: auth.user.id,
        role: SharedSpaceRole.Owner,
      });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getMembers.mockResolvedValue([member]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(0);
      mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);
      mocks.sharedSpace.getNewAssetCount.mockResolvedValue(0);
      mocks.sharedSpace.getLinkedLibraries.mockResolvedValue([]);

      const result = await sut.get(auth, space.id);

      expect(result.linkedLibraries).toEqual([]);
    });
  });

  describe('handleSharedSpaceLibraryFaceSync', () => {
    it('should process library assets with faces in batches', async () => {
      const spaceId = newUuid();
      const libraryId = newUuid();
      const assetId1 = newUuid();
      const assetId2 = newUuid();

      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
      mocks.sharedSpace.hasLibraryLink.mockResolvedValue(true);
      mocks.asset.getByLibraryIdWithFaces
        .mockResolvedValueOnce([{ id: assetId1 }, { id: assetId2 }])
        .mockResolvedValueOnce([]);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([]);
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      const result = await sut.handleSharedSpaceLibraryFaceSync({ spaceId, libraryId });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.asset.getByLibraryIdWithFaces).toHaveBeenCalledWith(libraryId, 1000, 0);
      expect(mocks.asset.getByLibraryIdWithFaces).toHaveBeenCalledWith(libraryId, 1000, 2);
    });

    it('should skip when space does not exist', async () => {
      mocks.sharedSpace.getById.mockResolvedValue(void 0);
      const result = await sut.handleSharedSpaceLibraryFaceSync({ spaceId: newUuid(), libraryId: newUuid() });
      expect(result).toBe(JobStatus.Skipped);
    });

    it('should skip when face recognition is disabled on the space', async () => {
      const spaceId = newUuid();
      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false }));
      const result = await sut.handleSharedSpaceLibraryFaceSync({ spaceId, libraryId: newUuid() });
      expect(result).toBe(JobStatus.Skipped);
    });

    it('should skip when library link was removed before job runs', async () => {
      const spaceId = newUuid();
      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
      mocks.sharedSpace.hasLibraryLink.mockResolvedValue(false);
      const result = await sut.handleSharedSpaceLibraryFaceSync({ spaceId, libraryId: newUuid() });
      expect(result).toBe(JobStatus.Skipped);
    });

    it('should succeed with no work when library has no assets with faces', async () => {
      const spaceId = newUuid();
      const libraryId = newUuid();
      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
      mocks.sharedSpace.hasLibraryLink.mockResolvedValue(true);
      mocks.asset.getByLibraryIdWithFaces.mockResolvedValue([]);
      const result = await sut.handleSharedSpaceLibraryFaceSync({ spaceId, libraryId });
      expect(result).toBe(JobStatus.Success);
    });

    it('should call face matching for each asset with faces', async () => {
      const spaceId = newUuid();
      const libraryId = newUuid();
      const assetId = newUuid();
      const faceId = newUuid();
      const personalPersonId = newUuid();

      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
      mocks.sharedSpace.hasLibraryLink.mockResolvedValue(true);
      mocks.asset.getByLibraryIdWithFaces.mockResolvedValueOnce([{ id: assetId }]).mockResolvedValueOnce([]);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
        { id: faceId, assetId, personId: personalPersonId, embedding: '[0.1,0.2]' },
      ]);
      mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(false);
      mocks.sharedSpace.findClosestSpacePerson.mockResolvedValue([]);
      mocks.sharedSpace.addPersonFaces.mockResolvedValue([]);
      mocks.sharedSpace.createPerson.mockResolvedValue(factory.sharedSpacePerson({ spaceId }));
      mocks.person.getById.mockResolvedValue(factory.person({ id: personalPersonId }));
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      const result = await sut.handleSharedSpaceLibraryFaceSync({ spaceId, libraryId });
      expect(result).toBe(JobStatus.Success);
      expect(mocks.sharedSpace.getAssetFacesForMatching).toHaveBeenCalledWith(assetId);
    });

    it('should create new space person for unmatched face', async () => {
      const spaceId = newUuid();
      const libraryId = newUuid();
      const assetId = newUuid();
      const faceId = newUuid();
      const personalPersonId = newUuid();

      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
      mocks.sharedSpace.hasLibraryLink.mockResolvedValue(true);
      mocks.asset.getByLibraryIdWithFaces.mockResolvedValueOnce([{ id: assetId }]).mockResolvedValueOnce([]);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
        { id: faceId, assetId, personId: personalPersonId, embedding: '[0.1,0.2]' },
      ]);
      mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(false);
      mocks.sharedSpace.findClosestSpacePerson.mockResolvedValue([]);
      mocks.sharedSpace.createPerson.mockResolvedValue(factory.sharedSpacePerson({ spaceId }));
      mocks.sharedSpace.addPersonFaces.mockResolvedValue([]);
      mocks.person.getById.mockResolvedValue(factory.person({ id: personalPersonId }));
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      await sut.handleSharedSpaceLibraryFaceSync({ spaceId, libraryId });
      expect(mocks.sharedSpace.createPerson).toHaveBeenCalled();
      expect(mocks.sharedSpace.addPersonFaces).toHaveBeenCalled();
    });

    it('should match face to existing space person when close enough', async () => {
      const spaceId = newUuid();
      const libraryId = newUuid();
      const assetId = newUuid();
      const faceId = newUuid();
      const existingPersonId = newUuid();

      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
      mocks.sharedSpace.hasLibraryLink.mockResolvedValue(true);
      mocks.asset.getByLibraryIdWithFaces.mockResolvedValueOnce([{ id: assetId }]).mockResolvedValueOnce([]);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
        { id: faceId, assetId, personId: null, embedding: '[0.1,0.2]' },
      ]);
      mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(false);
      mocks.sharedSpace.findClosestSpacePerson.mockResolvedValue([
        { personId: existingPersonId, name: '', distance: 0.3 },
      ]);
      mocks.sharedSpace.addPersonFaces.mockResolvedValue([]);
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      await sut.handleSharedSpaceLibraryFaceSync({ spaceId, libraryId });
      expect(mocks.sharedSpace.addPersonFaces).toHaveBeenCalledWith([
        { personId: existingPersonId, assetFaceId: faceId },
      ]);
      expect(mocks.sharedSpace.createPerson).not.toHaveBeenCalled();
    });
  });

  describe('handleSharedSpaceBulkAddAssets', () => {
    it('should skip when user is no longer a member', async () => {
      mocks.sharedSpace.getMember.mockResolvedValue(void 0);

      const result = await sut.handleSharedSpaceBulkAddAssets({ spaceId: newUuid(), userId: newUuid() });

      expect(result).toBe(JobStatus.Skipped);
      expect(mocks.sharedSpace.bulkAddUserAssets).not.toHaveBeenCalled();
    });

    it('should skip when user has been demoted to viewer', async () => {
      const spaceId = newUuid();
      const userId = newUuid();
      const viewerMember = makeMemberResult({ spaceId, userId, role: SharedSpaceRole.Viewer });

      mocks.sharedSpace.getMember.mockResolvedValue(viewerMember);

      const result = await sut.handleSharedSpaceBulkAddAssets({ spaceId, userId });

      expect(result).toBe(JobStatus.Skipped);
      expect(mocks.sharedSpace.bulkAddUserAssets).not.toHaveBeenCalled();
    });

    it('should skip when space is deleted', async () => {
      const spaceId = newUuid();
      const userId = newUuid();
      const editorMember = makeMemberResult({ spaceId, userId, role: SharedSpaceRole.Editor });

      mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
      mocks.sharedSpace.getById.mockResolvedValue(void 0);

      const result = await sut.handleSharedSpaceBulkAddAssets({ spaceId, userId });

      expect(result).toBe(JobStatus.Skipped);
      expect(mocks.sharedSpace.bulkAddUserAssets).not.toHaveBeenCalled();
    });

    it('should call bulkAddUserAssets with correct spaceId and userId', async () => {
      const spaceId = newUuid();
      const userId = newUuid();
      const editorMember = makeMemberResult({ spaceId, userId, role: SharedSpaceRole.Editor });
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false });

      mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.bulkAddUserAssets.mockResolvedValue(5);
      mocks.sharedSpace.update.mockResolvedValue(space);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);
      mocks.notification.create.mockResolvedValue({
        id: 'n1',
        createdAt: new Date(),
        level: 'success',
        type: 'Custom',
        title: '',
        description: null,
        data: null,
        readAt: null,
      } as any);

      await sut.handleSharedSpaceBulkAddAssets({ spaceId, userId });

      expect(mocks.sharedSpace.bulkAddUserAssets).toHaveBeenCalledWith(spaceId, userId);
    });

    it('should update lastActivityAt on the space', async () => {
      const spaceId = newUuid();
      const userId = newUuid();
      const editorMember = makeMemberResult({ spaceId, userId, role: SharedSpaceRole.Editor });
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false });

      mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.bulkAddUserAssets.mockResolvedValue(10);
      mocks.sharedSpace.update.mockResolvedValue(space);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);
      mocks.notification.create.mockResolvedValue({
        id: 'n1',
        createdAt: new Date(),
        level: 'success',
        type: 'Custom',
        title: '',
        description: null,
        data: null,
        readAt: null,
      } as any);

      await sut.handleSharedSpaceBulkAddAssets({ spaceId, userId });

      expect(mocks.sharedSpace.update).toHaveBeenCalledWith(spaceId, { lastActivityAt: expect.any(Date) });
    });

    it('should log activity with count and bulk flag', async () => {
      const spaceId = newUuid();
      const userId = newUuid();
      const editorMember = makeMemberResult({ spaceId, userId, role: SharedSpaceRole.Editor });
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false });

      mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.bulkAddUserAssets.mockResolvedValue(42);
      mocks.sharedSpace.update.mockResolvedValue(space);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);
      mocks.notification.create.mockResolvedValue({
        id: 'n1',
        createdAt: new Date(),
        level: 'success',
        type: 'Custom',
        title: '',
        description: null,
        data: null,
        readAt: null,
      } as any);

      await sut.handleSharedSpaceBulkAddAssets({ spaceId, userId });

      expect(mocks.sharedSpace.logActivity).toHaveBeenCalledWith({
        spaceId,
        userId,
        type: SharedSpaceActivityType.AssetAdd,
        data: { count: 42, bulk: true },
      });
    });

    it('should NOT log activity when count is 0', async () => {
      const spaceId = newUuid();
      const userId = newUuid();
      const editorMember = makeMemberResult({ spaceId, userId, role: SharedSpaceRole.Editor });
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false });

      mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.bulkAddUserAssets.mockResolvedValue(0);

      await sut.handleSharedSpaceBulkAddAssets({ spaceId, userId });

      expect(mocks.sharedSpace.logActivity).not.toHaveBeenCalled();
      expect(mocks.sharedSpace.update).not.toHaveBeenCalled();
    });

    it('should NOT send notification when count is 0', async () => {
      const spaceId = newUuid();
      const userId = newUuid();
      const editorMember = makeMemberResult({ spaceId, userId, role: SharedSpaceRole.Editor });
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false });

      mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.bulkAddUserAssets.mockResolvedValue(0);

      await sut.handleSharedSpaceBulkAddAssets({ spaceId, userId });

      expect(mocks.notification.create).not.toHaveBeenCalled();
      expect(mocks.websocket.clientSend).not.toHaveBeenCalled();
    });

    it('should queue SharedSpaceFaceMatchAll when faceRecognitionEnabled', async () => {
      const spaceId = newUuid();
      const userId = newUuid();
      const editorMember = makeMemberResult({ spaceId, userId, role: SharedSpaceRole.Editor });
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });

      mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.bulkAddUserAssets.mockResolvedValue(100);
      mocks.sharedSpace.update.mockResolvedValue(space);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);
      mocks.notification.create.mockResolvedValue({
        id: 'n1',
        createdAt: new Date(),
        level: 'success',
        type: 'Custom',
        title: '',
        description: null,
        data: null,
        readAt: null,
      } as any);

      await sut.handleSharedSpaceBulkAddAssets({ spaceId, userId });

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.SharedSpaceFaceMatchAll,
        data: { spaceId },
      });
    });

    it('should NOT queue SharedSpaceFaceMatchAll when faceRecognitionEnabled is false', async () => {
      const spaceId = newUuid();
      const userId = newUuid();
      const editorMember = makeMemberResult({ spaceId, userId, role: SharedSpaceRole.Editor });
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false });

      mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.bulkAddUserAssets.mockResolvedValue(10);
      mocks.sharedSpace.update.mockResolvedValue(space);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);
      mocks.notification.create.mockResolvedValue({
        id: 'n1',
        createdAt: new Date(),
        level: 'success',
        type: 'Custom',
        title: '',
        description: null,
        data: null,
        readAt: null,
      } as any);

      await sut.handleSharedSpaceBulkAddAssets({ spaceId, userId });

      expect(mocks.job.queue).not.toHaveBeenCalledWith(
        expect.objectContaining({ name: JobName.SharedSpaceFaceMatchAll }),
      );
    });

    it('should send websocket notification on completion', async () => {
      const spaceId = newUuid();
      const userId = newUuid();
      const editorMember = makeMemberResult({ spaceId, userId, role: SharedSpaceRole.Editor });
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false });

      mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.bulkAddUserAssets.mockResolvedValue(200);
      mocks.sharedSpace.update.mockResolvedValue(space);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);
      mocks.notification.create.mockResolvedValue({
        id: 'n1',
        createdAt: new Date(),
        level: 'success',
        type: 'Custom',
        title: 'Bulk add complete',
        description: '200 photos added to space',
        data: null,
        readAt: null,
      } as any);

      await sut.handleSharedSpaceBulkAddAssets({ spaceId, userId });

      expect(mocks.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          type: NotificationType.Custom,
          level: NotificationLevel.Success,
        }),
      );
      expect(mocks.websocket.clientSend).toHaveBeenCalledWith('on_notification', userId, expect.any(Object));
    });

    it('should return JobStatus.Failed when bulkAddUserAssets throws', async () => {
      const spaceId = newUuid();
      const userId = newUuid();
      const editorMember = makeMemberResult({ spaceId, userId, role: SharedSpaceRole.Editor });
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false });

      mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.bulkAddUserAssets.mockRejectedValue(new Error('FK constraint violation'));

      const result = await sut.handleSharedSpaceBulkAddAssets({ spaceId, userId });

      expect(result).toBe(JobStatus.Failed);
    });

    it('should return JobStatus.Success on happy path', async () => {
      const spaceId = newUuid();
      const userId = newUuid();
      const editorMember = makeMemberResult({ spaceId, userId, role: SharedSpaceRole.Editor });
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false });

      mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.bulkAddUserAssets.mockResolvedValue(5);
      mocks.sharedSpace.update.mockResolvedValue(space);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);
      mocks.notification.create.mockResolvedValue({
        id: 'n1',
        createdAt: new Date(),
        level: 'success',
        type: 'Custom',
        title: '',
        description: null,
        data: null,
        readAt: null,
      } as any);

      const result = await sut.handleSharedSpaceBulkAddAssets({ spaceId, userId });

      expect(result).toBe(JobStatus.Success);
    });
  });
});
