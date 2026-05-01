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
    mocks.sharedSpace.hasPetsBySpaceId.mockResolvedValue(false);
    mocks.sharedSpace.recountPersons.mockResolvedValue(void 0);
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

    it('should drop both id and thumbhash when thumbhash is null (parallel-array contract)', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace();
      const recentAssets = [
        { id: newUuid(), thumbhash: Buffer.from('abc123') },
        { id: newUuid(), thumbhash: null },
        { id: newUuid(), thumbhash: Buffer.from('def456') },
      ];

      mocks.sharedSpace.getAllByUserId.mockResolvedValue([space]);
      mocks.sharedSpace.getMembers.mockResolvedValue([]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(5);
      mocks.sharedSpace.getRecentAssets.mockResolvedValue(recentAssets);
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ lastViewedAt: null }));

      const result = await sut.getAll(auth);

      expect(result[0].recentAssetIds).toEqual([recentAssets[0].id, recentAssets[2].id]);
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
        { id: newUuid(), thumbhash: Buffer.from('thumb2') },
        { id: newUuid(), thumbhash: Buffer.from('thumb3') },
      ];

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMembers.mockResolvedValue([member]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(10);

      mocks.sharedSpace.getRecentAssets.mockResolvedValue(recentAssets);

      const result = await sut.get(auth, space.id);

      expect(result.recentAssetIds).toEqual([recentAssets[0].id, recentAssets[1].id, recentAssets[2].id]);
      expect(result.recentAssetThumbhashes).toEqual(['dGh1bWIx', 'dGh1bWIy', 'dGh1bWIz']);
    });

    it('should drop both id and thumbhash when thumbhash is null (parallel-array contract)', async () => {
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

      expect(result.recentAssetIds).toEqual([recentAssets[0].id, recentAssets[2].id]);
      expect(result.recentAssetThumbhashes).toEqual(['dGh1bWIx', 'dGh1bWIz']);
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

    it('should include hasPets=true when space has pet-type persons', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace({ faceRecognitionEnabled: true });
      const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Viewer });

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMembers.mockResolvedValue([member]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(0);
      mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);
      mocks.sharedSpace.hasPetsBySpaceId.mockResolvedValue(true);

      const result = await sut.get(auth, space.id);

      expect(result.hasPets).toBe(true);
    });

    it('should include hasPets=false when space has no pet-type persons', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace({ faceRecognitionEnabled: true });
      const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Viewer });

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMembers.mockResolvedValue([member]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(0);
      mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);
      mocks.sharedSpace.hasPetsBySpaceId.mockResolvedValue(false);

      const result = await sut.get(auth, space.id);

      expect(result.hasPets).toBe(false);
    });

    it('should not query hasPets when face recognition is disabled', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace({ faceRecognitionEnabled: false });
      const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Viewer });

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getMembers.mockResolvedValue([member]);
      mocks.sharedSpace.getAssetCount.mockResolvedValue(0);
      mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);

      const result = await sut.get(auth, space.id);

      expect(result.hasPets).toBeUndefined();
      expect(mocks.sharedSpace.hasPetsBySpaceId).not.toHaveBeenCalled();
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
    it('should no-op and return existing space when dto is empty', async () => {
      const auth = factory.auth();
      const space = factory.sharedSpace();
      const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Editor });

      mocks.sharedSpace.getMember.mockResolvedValue(member);
      mocks.sharedSpace.getById.mockResolvedValue(space);

      const result = await sut.update(auth, space.id, {});

      expect(result.id).toBe(space.id);
      expect(mocks.sharedSpace.update).not.toHaveBeenCalled();
      expect(mocks.sharedSpace.logActivity).not.toHaveBeenCalled();
    });

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

    it('should attach via Layer 1 when a space-person already exists for the personId', async () => {
      const spaceId = newUuid();
      const assetId = newUuid();
      const faceId = newUuid();
      const personalPersonId = newUuid();
      const existingSpacePersonId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
      const embedding = '[1,2,3]';

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
        { id: faceId, assetId, personId: personalPersonId, embedding },
      ]);
      mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(false);
      mocks.sharedSpace.findSpacePersonByLinkedPersonId.mockResolvedValue(
        factory.sharedSpacePerson({ id: existingSpacePersonId, spaceId }),
      );
      mocks.sharedSpace.addPersonFaces.mockResolvedValue([]);
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      const result = await sut.handleSharedSpaceFaceMatch({ spaceId, assetId });

      expect(result).toBe(JobStatus.Success);
      // Layer 1 hit → no embedding search, no person creation
      expect(mocks.sharedSpace.findClosestSpacePerson).not.toHaveBeenCalled();
      expect(mocks.sharedSpace.createPerson).not.toHaveBeenCalled();
      expect(mocks.sharedSpace.addPersonFaces).toHaveBeenCalledWith(
        [{ personId: existingSpacePersonId, assetFaceId: faceId }],
        { skipRecount: true },
      );
    });

    it('should not touch pre-existing stale rows (isPersonFaceAssigned short-circuit)', async () => {
      // Pre-bug scenario: a face was added to a space-person by the old loose
      // algorithm with no global personId. After the gate lands, that stale mapping
      // MUST survive so users do not silently lose data.
      const spaceId = newUuid();
      const assetId = newUuid();
      const faceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
      const embedding = '[1,2,3]';

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
        { id: faceId, assetId, personId: null, embedding },
      ]);
      // Stale row already exists
      mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(true);
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      const result = await sut.handleSharedSpaceFaceMatch({ spaceId, assetId });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.sharedSpace.addPersonFaces).not.toHaveBeenCalled();
      expect(mocks.sharedSpace.createPerson).not.toHaveBeenCalled();
      // Crucially, no delete/reassign path is exercised — the stale row must survive untouched
      expect(mocks.sharedSpace.removePersonFacesByAssetIds).not.toHaveBeenCalled();
      expect(mocks.sharedSpace.reassignPersonFaces).not.toHaveBeenCalled();
      expect(mocks.sharedSpace.reassignPersonFacesSafe).not.toHaveBeenCalled();
      expect(mocks.sharedSpace.deletePerson).not.toHaveBeenCalled();
      expect(mocks.sharedSpace.deleteOrphanedPersons).not.toHaveBeenCalled();
      expect(mocks.sharedSpace.deleteAllOrphanedPersons).not.toHaveBeenCalled();
    });

    it('should skip ML face without a personId (strict gate)', async () => {
      const spaceId = newUuid();
      const assetId = newUuid();
      const faceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
      const embedding = '[1,2,3]';

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
        { id: faceId, assetId, personId: null, embedding },
      ]);
      mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(false);
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      const result = await sut.handleSharedSpaceFaceMatch({ spaceId, assetId });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.sharedSpace.findClosestSpacePerson).not.toHaveBeenCalled();
      expect(mocks.sharedSpace.findSpacePersonByLinkedPersonId).not.toHaveBeenCalled();
      expect(mocks.sharedSpace.addPersonFaces).not.toHaveBeenCalled();
      expect(mocks.sharedSpace.createPerson).not.toHaveBeenCalled();
    });

    it('should match face to existing space-person via Layer 2 when Layer 1 has no match', async () => {
      const spaceId = newUuid();
      const assetId = newUuid();
      const faceId = newUuid();
      const personalPersonId = newUuid();
      const spacePersonId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
      const embedding = '[1,2,3]';

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
        { id: faceId, assetId, personId: personalPersonId, embedding },
      ]);
      mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(false);
      mocks.sharedSpace.findSpacePersonByLinkedPersonId.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.findClosestSpacePerson.mockResolvedValue([
        { personId: spacePersonId, name: 'Alice', distance: 0.3 },
      ]);
      mocks.sharedSpace.addPersonFaces.mockResolvedValue([]);
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      const result = await sut.handleSharedSpaceFaceMatch({ spaceId, assetId });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.sharedSpace.findSpacePersonByLinkedPersonId).toHaveBeenCalledWith(spaceId, personalPersonId);
      expect(mocks.sharedSpace.findClosestSpacePerson).toHaveBeenCalled();
      expect(mocks.sharedSpace.addPersonFaces).toHaveBeenCalledWith(
        [{ personId: spacePersonId, assetFaceId: faceId }],
        {
          skipRecount: true,
        },
      );
    });

    it('should create new space-person when no Layer 1 or Layer 2 match', async () => {
      const spaceId = newUuid();
      const assetId = newUuid();
      const faceId = newUuid();
      const newPersonId = newUuid();
      const personalPersonId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
      const embedding = '[1,2,3]';
      const newPerson = factory.sharedSpacePerson({ id: newPersonId, spaceId });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
        { id: faceId, assetId, personId: personalPersonId, embedding },
      ]);
      mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(false);
      mocks.sharedSpace.findSpacePersonByLinkedPersonId.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.findClosestSpacePerson.mockResolvedValue([]);
      mocks.sharedSpace.createPerson.mockResolvedValue(newPerson);
      mocks.sharedSpace.addPersonFaces.mockResolvedValue([]);
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      const result = await sut.handleSharedSpaceFaceMatch({ spaceId, assetId });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.sharedSpace.findSpacePersonByLinkedPersonId).toHaveBeenCalledWith(spaceId, personalPersonId);
      expect(mocks.sharedSpace.findClosestSpacePerson).toHaveBeenCalled();
      expect(mocks.sharedSpace.createPerson).toHaveBeenCalledWith({
        spaceId,
        name: '',
        representativeFaceId: faceId,
        type: 'person',
      });
      expect(mocks.sharedSpace.addPersonFaces).toHaveBeenCalledWith([{ personId: newPersonId, assetFaceId: faceId }], {
        skipRecount: true,
      });
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

    it('should handle asset with no faces gracefully and call recountPersons with empty array', async () => {
      const spaceId = newUuid();
      const assetId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([]);
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      const result = await sut.handleSharedSpaceFaceMatch({ spaceId, assetId });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.sharedSpace.recountPersons).not.toHaveBeenCalled();
    });

    it('should process multiple faces in a single asset', async () => {
      const spaceId = newUuid();
      const assetId = newUuid();
      const faceId1 = newUuid();
      const faceId2 = newUuid();
      const spacePersonId = newUuid();
      const newPersonId = newUuid();
      const personalPersonId1 = newUuid();
      const personalPersonId2 = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
      const newPerson = factory.sharedSpacePerson({ id: newPersonId, spaceId });
      const personalPerson = factory.person({ id: personalPersonId1, name: '' });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
        { id: faceId1, assetId, personId: personalPersonId1, embedding: '[1,2,3]' },
        { id: faceId2, assetId, personId: personalPersonId2, embedding: '[4,5,6]' },
      ]);
      mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(false);
      // First face: Layer 2 fallback finds an existing space-person.
      // Second face: Layer 1/2 both miss, creates new space-person.
      mocks.sharedSpace.findSpacePersonByLinkedPersonId.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.findClosestSpacePerson
        .mockResolvedValueOnce([{ personId: spacePersonId, name: 'Alice', distance: 0.3 }])
        .mockResolvedValueOnce([]);
      mocks.sharedSpace.createPerson.mockResolvedValue(newPerson);
      mocks.sharedSpace.addPersonFaces.mockResolvedValue([]);
      mocks.person.getById.mockResolvedValue(personalPerson);
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      const result = await sut.handleSharedSpaceFaceMatch({ spaceId, assetId });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.sharedSpace.addPersonFaces).toHaveBeenCalledTimes(2);
    });

    it('should create space person with empty name (name resolved via JOIN at read time)', async () => {
      const spaceId = newUuid();
      const assetId = newUuid();
      const faceId = newUuid();
      const newPersonId = newUuid();
      const personalPersonId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
      const newPerson = factory.sharedSpacePerson({ id: newPersonId, spaceId });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
        { id: faceId, assetId, personId: personalPersonId, embedding: '[1,2,3]' },
      ]);
      mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(false);
      mocks.sharedSpace.findClosestSpacePerson.mockResolvedValue([]);
      mocks.sharedSpace.findSpacePersonByLinkedPersonId.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.createPerson.mockResolvedValue(newPerson);
      mocks.sharedSpace.addPersonFaces.mockResolvedValue([]);
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      const result = await sut.handleSharedSpaceFaceMatch({ spaceId, assetId });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.person.getById).not.toHaveBeenCalled();
      expect(mocks.sharedSpace.createPerson).toHaveBeenCalledWith({
        spaceId,
        name: '',
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

    it('should use empty name when creating space person', async () => {
      const spaceId = newUuid();
      const assetId = newUuid();
      const faceId = newUuid();
      const newPersonId = newUuid();
      const personalPersonId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
      const newPerson = factory.sharedSpacePerson({ id: newPersonId, spaceId });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
        { id: faceId, assetId, personId: personalPersonId, embedding: '[1,2,3]' },
      ]);
      mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(false);
      mocks.sharedSpace.findClosestSpacePerson.mockResolvedValue([]);
      mocks.sharedSpace.findSpacePersonByLinkedPersonId.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.createPerson.mockResolvedValue(newPerson);
      mocks.sharedSpace.addPersonFaces.mockResolvedValue([]);
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

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([]);
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([{ id: petFaceId, assetId, personId: personalPersonId }]);
      mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(false);
      mocks.sharedSpace.findSpacePersonByLinkedPersonId.mockResolvedValue(void 0);
      mocks.sharedSpace.createPerson.mockResolvedValue(newPerson);
      mocks.sharedSpace.addPersonFaces.mockResolvedValue([]);

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

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
        { id: faceId, assetId, personId: personalPersonId, embedding: '[1,2,3]' },
      ]);
      mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(false);
      mocks.sharedSpace.findClosestSpacePerson.mockResolvedValue([]);
      mocks.sharedSpace.findSpacePersonByLinkedPersonId.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.createPerson.mockResolvedValue(newPerson);
      mocks.sharedSpace.addPersonFaces.mockResolvedValue([]);
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      await sut.handleSharedSpaceFaceMatch({ spaceId, assetId });

      expect(mocks.sharedSpace.createPerson).toHaveBeenCalledWith(expect.objectContaining({ type: 'person' }));
    });

    it('should queue dedup pass after successful face match', async () => {
      const spaceId = newUuid();
      const assetId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([]);
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      await sut.handleSharedSpaceFaceMatch({ spaceId, assetId });

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.SharedSpacePersonDedup,
        data: { spaceId },
      });
    });
  });

  describe('handleSharedSpaceFaceMatchAll', () => {
    it('should skip when space not found', async () => {
      mocks.sharedSpace.getById.mockResolvedValue(void 0);

      const result = await sut.handleSharedSpaceFaceMatchAll({ spaceId: 'space-1' });

      expect(result).toBe(JobStatus.Skipped);
      expect(mocks.sharedSpace.getAssetIdsInSpacePage).not.toHaveBeenCalled();
      expect(mocks.job.queue).not.toHaveBeenCalledWith(
        expect.objectContaining({ name: JobName.SharedSpacePersonDedup }),
      );
    });

    it('should skip when face recognition is disabled', async () => {
      const space = factory.sharedSpace({ faceRecognitionEnabled: false });
      mocks.sharedSpace.getById.mockResolvedValue(space);

      const result = await sut.handleSharedSpaceFaceMatchAll({ spaceId: space.id });

      expect(result).toBe(JobStatus.Skipped);
      expect(mocks.sharedSpace.getAssetIdsInSpacePage).not.toHaveBeenCalled();
      expect(mocks.job.queue).not.toHaveBeenCalledWith(
        expect.objectContaining({ name: JobName.SharedSpacePersonDedup }),
      );
    });

    it('should process pages sequentially without queueing per-asset child jobs', async () => {
      const spaceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });

      (sut as any).sharedSpaceFaceMatchBatchSize = 2;
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAssetIdsInSpacePage
        .mockResolvedValueOnce([{ assetId: 'a1' }, { assetId: 'a2' }])
        .mockResolvedValueOnce([{ assetId: 'a3' }]);
      const processSpy = vi.spyOn(sut as any, 'processSpaceFaceMatch').mockImplementation(async () => {});

      const result = await sut.handleSharedSpaceFaceMatchAll({ spaceId });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.sharedSpace.getAssetIdsInSpacePage).toHaveBeenNthCalledWith(1, spaceId, { limit: 2 });
      expect(mocks.sharedSpace.getAssetIdsInSpacePage).toHaveBeenNthCalledWith(2, spaceId, {
        limit: 2,
        afterAssetId: 'a2',
      });
      expect(processSpy).toHaveBeenNthCalledWith(1, spaceId, 'a1');
      expect(processSpy).toHaveBeenNthCalledWith(2, spaceId, 'a2');
      expect(processSpy).toHaveBeenNthCalledWith(3, spaceId, 'a3');
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.SharedSpacePersonDedup,
        data: { spaceId },
      });
    });

    it('should read an empty final page when the first page is exactly the batch size', async () => {
      const spaceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });

      (sut as any).sharedSpaceFaceMatchBatchSize = 2;
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAssetIdsInSpacePage
        .mockResolvedValueOnce([{ assetId: 'asset-1' }, { assetId: 'asset-2' }])
        .mockResolvedValueOnce([]);
      const processSpy = vi.spyOn(sut as any, 'processSpaceFaceMatch').mockImplementation(async () => {});

      const result = await sut.handleSharedSpaceFaceMatchAll({ spaceId });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.sharedSpace.getAssetIdsInSpacePage).toHaveBeenCalledTimes(2);
      expect(processSpy).toHaveBeenCalledTimes(2);
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.SharedSpacePersonDedup,
        data: { spaceId },
      });
    });

    it('should succeed without dedup when there are no assets to process', async () => {
      const spaceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });

      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAssetIdsInSpacePage.mockResolvedValueOnce([]);
      const processSpy = vi.spyOn(sut as any, 'processSpaceFaceMatch').mockImplementation(async () => {});

      const result = await sut.handleSharedSpaceFaceMatchAll({ spaceId });

      expect(result).toBe(JobStatus.Success);
      expect(processSpy).not.toHaveBeenCalled();
      expect(mocks.job.queue).not.toHaveBeenCalledWith(
        expect.objectContaining({ name: JobName.SharedSpacePersonDedup }),
      );
    });

    it('should stop without dedup when face recognition is disabled between pages', async () => {
      const spaceId = newUuid();
      const enabled = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
      const disabled = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false });

      (sut as any).sharedSpaceFaceMatchBatchSize = 2;
      mocks.sharedSpace.getById
        .mockResolvedValueOnce(enabled)
        .mockResolvedValueOnce(enabled)
        .mockResolvedValueOnce(disabled);
      mocks.sharedSpace.getAssetIdsInSpacePage.mockResolvedValueOnce([{ assetId: 'a1' }, { assetId: 'a2' }]);
      const processSpy = vi.spyOn(sut as any, 'processSpaceFaceMatch').mockImplementation(async () => {});

      const result = await sut.handleSharedSpaceFaceMatchAll({ spaceId });

      expect(result).toBe(JobStatus.Success);
      expect(processSpy).toHaveBeenCalledTimes(2);
      expect(mocks.sharedSpace.getAssetIdsInSpacePage).toHaveBeenCalledTimes(1);
      expect(mocks.job.queue).not.toHaveBeenCalledWith(
        expect.objectContaining({ name: JobName.SharedSpacePersonDedup }),
      );
    });

    it('should stop without dedup when the space is deleted between pages', async () => {
      const spaceId = newUuid();
      const enabled = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });

      (sut as any).sharedSpaceFaceMatchBatchSize = 2;
      mocks.sharedSpace.getById
        .mockResolvedValueOnce(enabled)
        .mockResolvedValueOnce(enabled)
        .mockImplementationOnce(async () => {});
      mocks.sharedSpace.getAssetIdsInSpacePage.mockResolvedValueOnce([{ assetId: 'a1' }, { assetId: 'a2' }]);
      const processSpy = vi.spyOn(sut as any, 'processSpaceFaceMatch').mockImplementation(async () => {});

      const result = await sut.handleSharedSpaceFaceMatchAll({ spaceId });

      expect(result).toBe(JobStatus.Success);
      expect(processSpy).toHaveBeenCalledTimes(2);
      expect(mocks.sharedSpace.getAssetIdsInSpacePage).toHaveBeenCalledTimes(1);
      expect(mocks.job.queue).not.toHaveBeenCalledWith(
        expect.objectContaining({ name: JobName.SharedSpacePersonDedup }),
      );
    });

    it('should re-check the space before queuing final dedup', async () => {
      const spaceId = newUuid();
      const enabled = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
      const disabled = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false });

      (sut as any).sharedSpaceFaceMatchBatchSize = 2;
      mocks.sharedSpace.getById
        .mockResolvedValueOnce(enabled)
        .mockResolvedValueOnce(enabled)
        .mockResolvedValueOnce(disabled);
      mocks.sharedSpace.getAssetIdsInSpacePage.mockResolvedValueOnce([{ assetId: 'a1' }]);
      const processSpy = vi.spyOn(sut as any, 'processSpaceFaceMatch').mockImplementation(async () => {});

      const result = await sut.handleSharedSpaceFaceMatchAll({ spaceId });

      expect(result).toBe(JobStatus.Success);
      expect(processSpy).toHaveBeenCalledTimes(1);
      expect(mocks.job.queue).not.toHaveBeenCalledWith(
        expect.objectContaining({ name: JobName.SharedSpacePersonDedup }),
      );
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
      });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([
        { ...person, personalName: 'Alice', personalThumbnailPath: '/path/to/thumb.jpg', faceCount: 5, assetCount: 3 },
      ]);
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
        name: 'Many Photos',
      });
      const person2 = factory.sharedSpacePerson({
        id: newUuid(),
        spaceId,
        name: 'Some Photos',
      });
      const person3 = factory.sharedSpacePerson({
        id: newUuid(),
        spaceId,
        name: 'Few Photos',
      });
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      // Repository returns pre-sorted by asset count descending
      mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([
        {
          ...person1,
          personalName: 'Many Photos',
          personalThumbnailPath: '/path/to/thumb.jpg',
          faceCount: 1,
          assetCount: 10,
        },
        {
          ...person2,
          personalName: 'Some Photos',
          personalThumbnailPath: '/path/to/thumb.jpg',
          faceCount: 1,
          assetCount: 5,
        },
        {
          ...person3,
          personalName: 'Few Photos',
          personalThumbnailPath: '/path/to/thumb.jpg',
          faceCount: 1,
          assetCount: 2,
        },
      ]);
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
      });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      // SQL already filters out persons without thumbnails
      mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([
        {
          ...personWithThumb,
          personalName: 'Has Thumb',
          personalThumbnailPath: '/path/to/thumb.jpg',
          faceCount: 1,
          assetCount: 1,
        },
      ]);
      mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);

      const result = await sut.getSpacePeople(auth, spaceId);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Has Thumb');
      expect(mocks.sharedSpace.getPersonsBySpaceId).toHaveBeenCalledWith(spaceId, {
        withHidden: false,
        petsEnabled: true,
        limit: undefined,
        offset: undefined,
        named: undefined,
        takenAfter: undefined,
        takenBefore: undefined,
      });
    });

    it('should filter out pets when petsEnabled is false', async () => {
      const spaceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true, petsEnabled: false });
      const humanPerson = factory.sharedSpacePerson({ spaceId, type: 'person' });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      // SQL already filters out pets when petsEnabled is false
      mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([
        { ...humanPerson, personalName: 'Human', personalThumbnailPath: '/thumb.jpg', faceCount: 1, assetCount: 1 },
      ]);
      mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);

      const result = await sut.getSpacePeople(factory.auth(), spaceId);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('person');
      expect(mocks.sharedSpace.getPersonsBySpaceId).toHaveBeenCalledWith(spaceId, {
        withHidden: false,
        petsEnabled: false,
        limit: undefined,
        offset: undefined,
        named: undefined,
        takenAfter: undefined,
        takenBefore: undefined,
      });
    });

    it('should exclude hidden persons', async () => {
      const spaceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
      const visiblePerson = factory.sharedSpacePerson({ spaceId, isHidden: false });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      // SQL already filters out hidden persons
      mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([
        { ...visiblePerson, personalName: 'Visible', personalThumbnailPath: '/thumb.jpg', faceCount: 1, assetCount: 1 },
      ]);
      mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);

      const result = await sut.getSpacePeople(factory.auth(), spaceId);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Visible');
      expect(mocks.sharedSpace.getPersonsBySpaceId).toHaveBeenCalledWith(spaceId, {
        withHidden: false,
        petsEnabled: true,
        limit: undefined,
        offset: undefined,
        named: undefined,
        takenAfter: undefined,
        takenBefore: undefined,
      });
    });

    it('should include pets when petsEnabled is true', async () => {
      const spaceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true, petsEnabled: true });
      const humanPerson = factory.sharedSpacePerson({ spaceId, type: 'person' });
      const petPerson = factory.sharedSpacePerson({ spaceId, type: 'pet' });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([
        { ...humanPerson, personalName: 'Human', personalThumbnailPath: '/thumb.jpg', faceCount: 1, assetCount: 1 },
        { ...petPerson, personalName: 'Pet', personalThumbnailPath: '/pet.jpg', faceCount: 1, assetCount: 1 },
      ]);
      mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);

      const result = await sut.getSpacePeople(factory.auth(), spaceId);

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.type)).toEqual(expect.arrayContaining(['person', 'pet']));
      expect(mocks.sharedSpace.getPersonsBySpaceId).toHaveBeenCalledWith(spaceId, {
        withHidden: false,
        petsEnabled: true,
        limit: undefined,
        offset: undefined,
        named: undefined,
        takenAfter: undefined,
        takenBefore: undefined,
      });
    });

    it('should filter people by temporal range', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
      const person = factory.sharedSpacePerson({
        id: newUuid(),
        spaceId,
        name: 'Temporal Person',
      });
      const takenAfter = new Date('2025-01-01');
      const takenBefore = new Date('2025-12-31');

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([
        {
          ...person,
          personalName: 'Temporal Person',
          personalThumbnailPath: '/path/to/thumb.jpg',
          faceCount: 3,
          assetCount: 2,
        },
      ]);
      mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);

      const result = await sut.getSpacePeople(auth, spaceId, { takenAfter, takenBefore });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Temporal Person');
      expect(mocks.sharedSpace.getPersonsBySpaceId).toHaveBeenCalledWith(spaceId, {
        withHidden: false,
        petsEnabled: true,
        limit: undefined,
        offset: undefined,
        named: undefined,
        takenAfter,
        takenBefore,
      });
    });

    it('should return all people when no temporal params provided', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
      const person = factory.sharedSpacePerson({
        id: newUuid(),
        spaceId,
        name: 'All People',
      });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([
        {
          ...person,
          personalName: 'All People',
          personalThumbnailPath: '/path/to/thumb.jpg',
          faceCount: 1,
          assetCount: 1,
        },
      ]);
      mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);

      const result = await sut.getSpacePeople(auth, spaceId);

      expect(result).toHaveLength(1);
      expect(mocks.sharedSpace.getPersonsBySpaceId).toHaveBeenCalledWith(spaceId, {
        withHidden: false,
        petsEnabled: true,
        limit: undefined,
        offset: undefined,
        named: undefined,
        takenAfter: undefined,
        takenBefore: undefined,
      });
    });

    it('should exclude person with zero face assets in date range', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
      const personInRange = factory.sharedSpacePerson({
        id: newUuid(),
        spaceId,
        name: 'In Range',
      });
      // The aggregated query naturally excludes persons with zero faces in range,
      // so only personInRange is returned by the repository
      const takenAfter = new Date('2025-06-01');

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([
        {
          ...personInRange,
          personalName: 'In Range',
          personalThumbnailPath: '/path/to/thumb.jpg',
          faceCount: 1,
          assetCount: 1,
        },
      ]);
      mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);

      const result = await sut.getSpacePeople(auth, spaceId, { takenAfter });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('In Range');
      expect(mocks.sharedSpace.getPersonsBySpaceId).toHaveBeenCalledWith(spaceId, {
        withHidden: false,
        petsEnabled: true,
        limit: undefined,
        offset: undefined,
        named: undefined,
        takenAfter,
        takenBefore: undefined,
      });
    });

    it('should resolve name from personal person when space person has no name override', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const personId = newUuid();
      const faceId = newUuid();
      const person = factory.sharedSpacePerson({
        id: personId,
        name: '',
        representativeFaceId: faceId,
      });
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ faceRecognitionEnabled: true }));
      mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([
        { ...person, personalName: 'Alice', personalThumbnailPath: '/path/to/thumb.jpg', faceCount: 3, assetCount: 2 },
      ]);
      mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);
      const result = await sut.getSpacePeople(auth, spaceId);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice');
      expect(result[0].thumbnailPath).toBe('/path/to/thumb.jpg');
    });

    it('should use space person name as override when set', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const personId = newUuid();
      const faceId = newUuid();
      const person = factory.sharedSpacePerson({
        id: personId,
        name: 'Grandpa',
        representativeFaceId: faceId,
      });
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ faceRecognitionEnabled: true }));
      mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([
        { ...person, personalName: 'Hans', personalThumbnailPath: '/path/to/thumb.jpg', faceCount: 3, assetCount: 2 },
      ]);
      mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);
      const result = await sut.getSpacePeople(auth, spaceId);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Grandpa');
    });

    it('should exclude persons with no thumbnail from personal person', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      // SQL already filters out persons without thumbnails
      mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([]);
      mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);

      const result = await sut.getSpacePeople(auth, spaceId);

      expect(result).toHaveLength(0);
      expect(mocks.sharedSpace.getPersonsBySpaceId).toHaveBeenCalledWith(spaceId, {
        withHidden: false,
        petsEnabled: true,
        limit: undefined,
        offset: undefined,
        named: undefined,
        takenAfter: undefined,
        takenBefore: undefined,
      });
    });

    it('should exclude persons with null personal thumbnail (no linked personal person)', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      // SQL already filters out persons with null thumbnails
      mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([]);
      mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);

      const result = await sut.getSpacePeople(auth, spaceId);

      expect(result).toHaveLength(0);
      expect(mocks.sharedSpace.getPersonsBySpaceId).toHaveBeenCalledWith(spaceId, {
        withHidden: false,
        petsEnabled: true,
        limit: undefined,
        offset: undefined,
        named: undefined,
        takenAfter: undefined,
        takenBefore: undefined,
      });
    });

    it('should use space person name override even when personal person has no name', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const personId = newUuid();
      const faceId = newUuid();
      const person = factory.sharedSpacePerson({
        id: personId,
        name: 'Custom Name',
        representativeFaceId: faceId,
      });
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ faceRecognitionEnabled: true }));
      mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([
        { ...person, personalName: '', personalThumbnailPath: '/path/to/thumb.jpg', faceCount: 1, assetCount: 1 },
      ]);
      mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);
      const result = await sut.getSpacePeople(auth, spaceId);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Custom Name');
    });

    it('should include hidden persons when withHidden is true', async () => {
      const spaceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
      const hiddenPerson = factory.sharedSpacePerson({ spaceId, isHidden: true });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ spaceId }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([
        { ...hiddenPerson, personalName: 'Hidden', personalThumbnailPath: '/thumb.jpg', faceCount: 1, assetCount: 1 },
      ]);
      mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);

      const result = await sut.getSpacePeople(factory.auth(), spaceId, { withHidden: true });

      expect(result).toHaveLength(1);
      expect(mocks.sharedSpace.getPersonsBySpaceId).toHaveBeenCalledWith(spaceId, {
        withHidden: true,
        petsEnabled: true,
        limit: undefined,
        offset: undefined,
        named: undefined,
        takenAfter: undefined,
        takenBefore: undefined,
      });
    });

    it('should exclude hidden persons by default', async () => {
      const spaceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ spaceId }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      // SQL already filters out hidden persons with withHidden: false
      mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([]);
      mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);

      const result = await sut.getSpacePeople(factory.auth(), spaceId);

      expect(result).toHaveLength(0);
      expect(mocks.sharedSpace.getPersonsBySpaceId).toHaveBeenCalledWith(spaceId, {
        withHidden: false,
        petsEnabled: true,
        limit: undefined,
        offset: undefined,
        named: undefined,
        takenAfter: undefined,
        takenBefore: undefined,
      });
    });

    it('should pass limit to repository', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([]);
      mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);

      await sut.getSpacePeople(auth, spaceId, { limit: 10 });

      expect(mocks.sharedSpace.getPersonsBySpaceId).toHaveBeenCalledWith(spaceId, {
        withHidden: false,
        petsEnabled: true,
        limit: 10,
        offset: undefined,
        named: undefined,
        takenAfter: undefined,
        takenBefore: undefined,
      });
    });

    it('should pass name search to repository', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([]);
      mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);

      await sut.getSpacePeople(auth, spaceId, { name: 'Ali', limit: 5 } as never);

      expect(mocks.sharedSpace.getPersonsBySpaceId).toHaveBeenCalledWith(spaceId, {
        withHidden: false,
        petsEnabled: true,
        limit: 5,
        offset: undefined,
        named: undefined,
        name: 'Ali',
        takenAfter: undefined,
        takenBefore: undefined,
      });
    });

    it('should return integer counts from denormalized columns', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const person = factory.sharedSpacePerson({ spaceId });
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([
        { ...person, personalName: 'Alice', personalThumbnailPath: '/thumb.jpg', faceCount: 5, assetCount: 3 },
      ]);
      mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);

      const result = await sut.getSpacePeople(auth, spaceId);

      expect(result[0].faceCount).toBe(5);
      expect(result[0].assetCount).toBe(3);
      expect(typeof result[0].faceCount).toBe('number');
      expect(typeof result[0].assetCount).toBe('number');
    });

    it('should skip alias lookup when no persons returned', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([]);

      const result = await sut.getSpacePeople(auth, spaceId);

      expect(result).toEqual([]);
      expect(mocks.sharedSpace.getAliasesBySpaceAndUser).not.toHaveBeenCalled();
    });

    it('should pass combined options for hidden, temporal, and limit', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true, petsEnabled: false });
      const takenAfter = new Date('2025-06-01');

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([]);
      mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);

      await sut.getSpacePeople(auth, spaceId, { withHidden: true, takenAfter, limit: 5 });

      expect(mocks.sharedSpace.getPersonsBySpaceId).toHaveBeenCalledWith(spaceId, {
        withHidden: true,
        petsEnabled: false,
        limit: 5,
        offset: undefined,
        named: undefined,
        takenAfter,
        takenBefore: undefined,
      });
    });

    it('should pass limit and offset to repository', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([]);
      mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);

      await sut.getSpacePeople(auth, spaceId, { limit: 50, offset: 10 });

      expect(mocks.sharedSpace.getPersonsBySpaceId).toHaveBeenCalledWith(spaceId, {
        withHidden: false,
        petsEnabled: true,
        limit: 50,
        offset: 10,
        named: undefined,
        takenAfter: undefined,
        takenBefore: undefined,
      });
    });

    it('should pass named: true to repository', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([]);
      mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);

      await sut.getSpacePeople(auth, spaceId, { named: true });

      expect(mocks.sharedSpace.getPersonsBySpaceId).toHaveBeenCalledWith(spaceId, {
        withHidden: false,
        petsEnabled: true,
        limit: undefined,
        offset: undefined,
        named: true,
        takenAfter: undefined,
        takenBefore: undefined,
      });
    });

    it('should support named and withHidden combined', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([]);
      mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);

      await sut.getSpacePeople(auth, spaceId, { named: true, withHidden: true });

      expect(mocks.sharedSpace.getPersonsBySpaceId).toHaveBeenCalledWith(spaceId, {
        withHidden: true,
        petsEnabled: true,
        limit: undefined,
        offset: undefined,
        named: true,
        takenAfter: undefined,
        takenBefore: undefined,
      });
    });

    it('should return empty array when offset exceeds total', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getPersonsBySpaceId.mockResolvedValue([]);
      mocks.sharedSpace.getAliasesBySpaceAndUser.mockResolvedValue([]);

      const result = await sut.getSpacePeople(auth, spaceId, { offset: 9999 });

      expect(result).toEqual([]);
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
      mocks.sharedSpace.getPersonById.mockResolvedValue({
        ...person,
        personalName: 'Bob Personal',
        personalThumbnailPath: '/personal-thumb.jpg',
        faceCount: 10,
        assetCount: 7,
      });
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAlias.mockResolvedValue(void 0);

      const result = await sut.getSpacePerson(auth, spaceId, personId);

      expect(result.id).toBe(personId);
      expect(result.name).toBe('Bob');
      expect(result.faceCount).toBe(10);
      expect(result.assetCount).toBe(7);
      expect(result.alias).toBeNull();
    });

    it('should resolve name from personal person when no override', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const personId = newUuid();
      const person = factory.sharedSpacePerson({ id: personId, spaceId, name: '' });
      const space = factory.sharedSpace({ id: spaceId });
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getPersonById.mockResolvedValue({
        ...person,
        personalName: 'Bob',
        personalThumbnailPath: '/thumb.jpg',
      });
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAlias.mockResolvedValue(void 0);

      const result = await sut.getSpacePerson(auth, spaceId, personId);

      expect(result.name).toBe('Bob');
    });

    it('should return birth date from linked personal person', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const personId = newUuid();
      const birthDate = '1984-05-09';
      const person = factory.sharedSpacePerson({ id: personId, spaceId, birthDate: null });
      const space = factory.sharedSpace({ id: spaceId });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getPersonById.mockResolvedValue({
        ...person,
        personalPersonId: newUuid(),
        personalBirthDate: new Date(birthDate),
      });
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAlias.mockResolvedValue(void 0);

      const result = await sut.getSpacePerson(auth, spaceId, personId);

      expect(result.birthDate).toBe(birthDate);
    });

    it('should read counts from person row without separate queries', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const personId = newUuid();
      const person = factory.sharedSpacePerson({ id: personId, spaceId, name: 'Counted' });
      const space = factory.sharedSpace({ id: spaceId });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getPersonById.mockResolvedValue({
        ...person,
        personalName: 'Counted',
        personalThumbnailPath: '/thumb.jpg',
        faceCount: 5,
        assetCount: 3,
      });
      mocks.sharedSpace.getById.mockResolvedValue(space);
      mocks.sharedSpace.getAlias.mockResolvedValue(void 0);

      const result = await sut.getSpacePerson(auth, spaceId, personId);

      expect(result.faceCount).toBe(5);
      expect(result.assetCount).toBe(3);
    });

    it('should reject access to pet person when petsEnabled is false', async () => {
      const spaceId = newUuid();
      const personId = newUuid();
      const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true, petsEnabled: false });
      const person = factory.sharedSpacePerson({ id: personId, spaceId, type: 'pet' });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ spaceId }));
      mocks.sharedSpace.getPersonById.mockResolvedValue({
        ...person,
        personalName: null,
        personalThumbnailPath: null,
      });
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

    it('should serve thumbnail from personal person via JOIN data without fallback chain', async () => {
      const spaceId = newUuid();
      const personId = newUuid();
      const faceId = newUuid();
      const person = factory.sharedSpacePerson({ id: personId, spaceId, representativeFaceId: faceId });
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getPersonById.mockResolvedValue({
        ...person,
        personalName: 'Alice',
        personalThumbnailPath: '/upload/thumbs/person.jpg',
      });
      vi.spyOn(sut as any, 'serveFromBackend').mockResolvedValue({} as any);

      await sut.getSpacePersonThumbnail(factory.auth(), spaceId, personId);
      expect(mocks.person.getFaceById).not.toHaveBeenCalled();
      expect(mocks.person.getById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when personal person has no thumbnail', async () => {
      const spaceId = newUuid();
      const personId = newUuid();
      const faceId = newUuid();
      const person = factory.sharedSpacePerson({ id: personId, spaceId, representativeFaceId: faceId });
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getPersonById.mockResolvedValue({
        ...person,
        personalName: 'Alice',
        personalThumbnailPath: null,
      });

      await expect(sut.getSpacePersonThumbnail(factory.auth(), spaceId, personId)).rejects.toThrow('Not Found');
    });

    it('should throw NotFoundException when person has no thumbnail and no personal person', async () => {
      const spaceId = newUuid();
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getPersonById.mockResolvedValue({
        ...factory.sharedSpacePerson({ spaceId, representativeFaceId: null }),
        personalName: null,
        personalThumbnailPath: null,
      });

      await expect(sut.getSpacePersonThumbnail(factory.auth(), spaceId, 'person-1')).rejects.toThrow('Not Found');
    });

    it('should throw NotFoundException when person belongs to different space', async () => {
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
      mocks.sharedSpace.getPersonById.mockResolvedValue({
        ...factory.sharedSpacePerson({ spaceId: 'other-space' }),
        personalName: null,
        personalThumbnailPath: null,
      });

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
      mocks.sharedSpace.getPersonById
        .mockResolvedValueOnce(person)
        .mockResolvedValueOnce({ ...updatedPerson, personalName: null, personalThumbnailPath: null });
      mocks.sharedSpace.updatePerson.mockResolvedValue(updatedPerson);

      mocks.sharedSpace.getAlias.mockResolvedValue(void 0);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      const result = await sut.updateSpacePerson(auth, spaceId, personId, { name: 'New Name' });

      expect(result.name).toBe('New Name');
      expect(mocks.sharedSpace.updatePerson).toHaveBeenCalledWith(personId, { name: 'New Name' });
    });

    it('should update linked personal person birth date', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const personId = newUuid();
      const personalPersonId = newUuid();
      const birthDate = '1984-05-09';
      const person = factory.sharedSpacePerson({ id: personId, spaceId });
      const updatedPerson = factory.sharedSpacePerson({ id: personId, spaceId, birthDate });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
      mocks.sharedSpace.getPersonById.mockResolvedValueOnce({ ...person, personalPersonId }).mockResolvedValueOnce({
        ...updatedPerson,
        birthDate: null,
        personalPersonId,
        personalBirthDate: new Date(birthDate),
        personalName: null,
        personalThumbnailPath: null,
      });
      mocks.person.update.mockResolvedValue(factory.person({ id: personalPersonId, birthDate: new Date(birthDate) }));
      mocks.sharedSpace.getAlias.mockResolvedValue(void 0);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      const result = await sut.updateSpacePerson(auth, spaceId, personId, { birthDate });

      expect(result.birthDate).toBe(birthDate);
      expect(mocks.person.update).toHaveBeenCalledWith({ id: personalPersonId, birthDate });
      expect(mocks.sharedSpace.updatePerson).not.toHaveBeenCalled();
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
      mocks.sharedSpace.getPersonById
        .mockResolvedValueOnce(person)
        .mockResolvedValueOnce({ ...updatedPerson, personalName: null, personalThumbnailPath: null });
      mocks.sharedSpace.isFaceInSpace.mockResolvedValue(true);
      mocks.sharedSpace.updatePerson.mockResolvedValue(updatedPerson);

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
      mocks.sharedSpace.getPersonById
        .mockResolvedValueOnce(person)
        .mockResolvedValueOnce({ ...person, personalName: null, personalThumbnailPath: null });
      mocks.sharedSpace.updatePerson.mockResolvedValue(person);

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

    it('should return enriched person with personal name after update', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      const personId = newUuid();
      const person = factory.sharedSpacePerson({ id: personId, spaceId });
      const updatedPerson = factory.sharedSpacePerson({ id: personId, spaceId, isHidden: true });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
      mocks.sharedSpace.getPersonById
        .mockResolvedValueOnce(person)
        .mockResolvedValueOnce({ ...updatedPerson, personalName: 'Alice', personalThumbnailPath: '/thumb.jpg' });
      mocks.sharedSpace.updatePerson.mockResolvedValue(updatedPerson);

      mocks.sharedSpace.getAlias.mockResolvedValue(void 0);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      const result = await sut.updateSpacePerson(auth, spaceId, personId, { isHidden: true });

      expect(result.name).toBe('Alice');
      expect(result.thumbnailPath).toBe('/thumb.jpg');
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
      mocks.sharedSpace.getPersonById.mockResolvedValue({
        ...person,
        personalName: null,
        personalThumbnailPath: null,
      });
      mocks.sharedSpace.deletePerson.mockResolvedValue(void 0 as any);
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
      mocks.sharedSpace.getPersonById.mockResolvedValue({
        ...person,
        personalName: null,
        personalThumbnailPath: null,
      });
      mocks.sharedSpace.deletePerson.mockResolvedValue(void 0 as any);
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
      mocks.sharedSpace.deletePerson.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.mergeSpacePeople(auth, spaceId, targetId, { ids: [sourceId] });

      expect(mocks.sharedSpace.reassignPersonFaces).toHaveBeenCalledWith(sourceId, targetId);
      expect(mocks.sharedSpace.deletePerson).toHaveBeenCalledWith(sourceId);
      expect(mocks.sharedSpace.recountPersons).toHaveBeenCalledTimes(1);
      expect(mocks.sharedSpace.recountPersons).toHaveBeenCalledWith([targetId]);
    });

    it('should not call recountPersons for deleted source persons', async () => {
      const auth = factory.auth();
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

      await sut.mergeSpacePeople(auth, spaceId, targetId, { ids: [sourceId] });

      expect(mocks.sharedSpace.recountPersons).toHaveBeenCalledWith([targetId]);
      expect(mocks.sharedSpace.recountPersons).not.toHaveBeenCalledWith(expect.arrayContaining([sourceId]));
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
      mocks.sharedSpace.deletePerson.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.mergeSpacePeople(factory.auth(), spaceId, targetId, { ids: [sourceId] });

      expect(mocks.sharedSpace.logActivity).toHaveBeenCalledWith({
        spaceId,
        userId: expect.any(String),
        type: SharedSpaceActivityType.PersonMerge,
        data: { targetPersonId: targetId, mergedCount: 1 },
      });
    });

    it('should queue dedup pass after successful merge', async () => {
      const spaceId = newUuid();
      const targetId = newUuid();
      const sourceId = newUuid();
      const target = factory.sharedSpacePerson({ id: targetId, spaceId });
      const source = factory.sharedSpacePerson({ id: sourceId, spaceId });

      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
      mocks.sharedSpace.getPersonById.mockResolvedValueOnce(target).mockResolvedValueOnce(source);
      mocks.sharedSpace.reassignPersonFaces.mockResolvedValue(void 0);
      mocks.sharedSpace.deletePerson.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

      await sut.mergeSpacePeople(factory.auth(), spaceId, targetId, { ids: [sourceId] });

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.SharedSpacePersonDedup,
        data: { spaceId },
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
      mocks.sharedSpace.removePersonFacesByLibrary.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.deleteOrphanedPersons.mockResolvedValue(void 0 as any);

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
      mocks.sharedSpace.removePersonFacesByLibrary.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.deleteOrphanedPersons.mockResolvedValue(void 0 as any);

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
      mocks.sharedSpace.removePersonFacesByLibrary.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.deleteOrphanedPersons.mockResolvedValue(void 0 as any);

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
      mocks.sharedSpace.removePersonFacesByLibrary.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.deleteOrphanedPersons.mockResolvedValue(void 0 as any);

      await sut.unlinkLibrary(auth, space.id, newUuid());

      expect(mocks.sharedSpace.removeLibrary).toHaveBeenCalled();
      expect(mocks.sharedSpace.removeAssets).not.toHaveBeenCalled();
    });

    describe('unlinkLibrary cleanup', () => {
      it('should call removePersonFacesByLibrary and deleteOrphanedPersons after unlink', async () => {
        const spaceId = newUuid();
        const libraryId = newUuid();
        const auth = factory.auth({ user: { isAdmin: true } });
        const member = makeMemberResult({
          spaceId,
          userId: auth.user.id,
          role: SharedSpaceRole.Owner,
        });

        mocks.sharedSpace.getMember.mockResolvedValue(member);
        mocks.sharedSpace.removeLibrary.mockResolvedValue(void 0 as any);
        mocks.sharedSpace.removePersonFacesByLibrary.mockResolvedValue(void 0 as any);
        mocks.sharedSpace.deleteOrphanedPersons.mockResolvedValue(void 0 as any);

        await sut.unlinkLibrary(auth, spaceId, libraryId);

        expect(mocks.sharedSpace.removeLibrary).toHaveBeenCalledWith(spaceId, libraryId);
        expect(mocks.sharedSpace.removePersonFacesByLibrary).toHaveBeenCalledWith(spaceId, libraryId);
        expect(mocks.sharedSpace.deleteOrphanedPersons).toHaveBeenCalledWith(spaceId);
      });
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
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.SharedSpacePersonDedup,
        data: { spaceId },
      });
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
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.SharedSpacePersonDedup,
        data: { spaceId },
      });
    });

    it('should stop syncing when library is unlinked during iteration', async () => {
      const spaceId = newUuid();
      const libraryId = newUuid();
      const assetId1 = newUuid();
      const assetId2 = newUuid();

      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
      mocks.sharedSpace.hasLibraryLink
        .mockResolvedValueOnce(true) // initial check
        .mockResolvedValueOnce(true) // first batch check inside loop
        .mockResolvedValueOnce(false); // second batch check — unlinked
      mocks.asset.getByLibraryIdWithFaces
        .mockResolvedValueOnce([{ id: assetId1 }])
        .mockResolvedValueOnce([{ id: assetId2 }]);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([]);
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      const result = await sut.handleSharedSpaceLibraryFaceSync({ spaceId, libraryId });

      expect(result).toBe(JobStatus.Success);
      // Only first batch should be processed
      expect(mocks.asset.getByLibraryIdWithFaces).toHaveBeenCalledTimes(1);
      expect(mocks.sharedSpace.getAssetFacesForMatching).toHaveBeenCalledTimes(1);
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
      mocks.sharedSpace.findSpacePersonByLinkedPersonId.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.addPersonFaces.mockResolvedValue([]);
      mocks.sharedSpace.createPerson.mockResolvedValue(factory.sharedSpacePerson({ spaceId }));
      mocks.person.getById.mockResolvedValue(factory.person({ id: personalPersonId }));
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      const result = await sut.handleSharedSpaceLibraryFaceSync({ spaceId, libraryId });
      expect(result).toBe(JobStatus.Success);
      expect(mocks.sharedSpace.getAssetFacesForMatching).toHaveBeenCalledWith(assetId);
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.SharedSpacePersonDedup,
        data: { spaceId },
      });
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
      mocks.sharedSpace.findSpacePersonByLinkedPersonId.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.createPerson.mockResolvedValue(factory.sharedSpacePerson({ spaceId }));
      mocks.sharedSpace.addPersonFaces.mockResolvedValue([]);
      mocks.person.getById.mockResolvedValue(factory.person({ id: personalPersonId }));
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      await sut.handleSharedSpaceLibraryFaceSync({ spaceId, libraryId });
      expect(mocks.sharedSpace.createPerson).toHaveBeenCalled();
      expect(mocks.sharedSpace.addPersonFaces).toHaveBeenCalled();
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.SharedSpacePersonDedup,
        data: { spaceId },
      });
    });

    it('should match face to existing space person via Layer 2 when Layer 1 has no match', async () => {
      const spaceId = newUuid();
      const libraryId = newUuid();
      const assetId = newUuid();
      const faceId = newUuid();
      const personalPersonId = newUuid();
      const existingPersonId = newUuid();

      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
      mocks.sharedSpace.hasLibraryLink.mockResolvedValue(true);
      mocks.asset.getByLibraryIdWithFaces.mockResolvedValueOnce([{ id: assetId }]).mockResolvedValueOnce([]);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
        { id: faceId, assetId, personId: personalPersonId, embedding: '[0.1,0.2]' },
      ]);
      mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(false);
      mocks.sharedSpace.findSpacePersonByLinkedPersonId.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.findClosestSpacePerson.mockResolvedValue([
        { personId: existingPersonId, name: '', distance: 0.3 },
      ]);
      mocks.sharedSpace.addPersonFaces.mockResolvedValue([]);
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      await sut.handleSharedSpaceLibraryFaceSync({ spaceId, libraryId });
      expect(mocks.sharedSpace.addPersonFaces).toHaveBeenCalledWith(
        [{ personId: existingPersonId, assetFaceId: faceId }],
        { skipRecount: true },
      );
      expect(mocks.sharedSpace.createPerson).not.toHaveBeenCalled();
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.SharedSpacePersonDedup,
        data: { spaceId },
      });
    });

    it('should reuse existing space person when face personId matches (Layer 1 dedup)', async () => {
      const spaceId = newUuid();
      const libraryId = newUuid();
      const assetId = newUuid();
      const faceId = newUuid();
      const personalPersonId = newUuid();
      const existingSpacePersonId = newUuid();

      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
      mocks.sharedSpace.hasLibraryLink.mockResolvedValue(true);
      mocks.asset.getByLibraryIdWithFaces.mockResolvedValueOnce([{ id: assetId }]).mockResolvedValueOnce([]);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
        { id: faceId, assetId, personId: personalPersonId, embedding: '[0.1,0.2]' },
      ]);
      mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(false);
      mocks.sharedSpace.findClosestSpacePerson.mockResolvedValue([]); // No embedding match
      mocks.sharedSpace.findSpacePersonByLinkedPersonId.mockResolvedValue(
        factory.sharedSpacePerson({ id: existingSpacePersonId, spaceId }),
      );
      mocks.sharedSpace.addPersonFaces.mockResolvedValue([]);
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      await sut.handleSharedSpaceLibraryFaceSync({ spaceId, libraryId });

      // Should NOT create a new person
      expect(mocks.sharedSpace.createPerson).not.toHaveBeenCalled();
      // Should assign face to the existing space person found by personId
      expect(mocks.sharedSpace.addPersonFaces).toHaveBeenCalledWith(
        [{ personId: existingSpacePersonId, assetFaceId: faceId }],
        { skipRecount: true },
      );
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.SharedSpacePersonDedup,
        data: { spaceId },
      });
    });

    it('should prefer Layer 1 personId match over Layer 2 embedding match', async () => {
      const spaceId = newUuid();
      const libraryId = newUuid();
      const assetId = newUuid();
      const faceId = newUuid();
      const personalPersonId = newUuid();
      const existingSpacePersonId = newUuid();

      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
      mocks.sharedSpace.hasLibraryLink.mockResolvedValue(true);
      mocks.asset.getByLibraryIdWithFaces.mockResolvedValueOnce([{ id: assetId }]).mockResolvedValueOnce([]);
      mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
        { id: faceId, assetId, personId: personalPersonId, embedding: '[0.1,0.2]' },
      ]);
      mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(false);
      mocks.sharedSpace.findSpacePersonByLinkedPersonId.mockResolvedValue(
        factory.sharedSpacePerson({ id: existingSpacePersonId, spaceId }),
      );
      mocks.sharedSpace.addPersonFaces.mockResolvedValue([]);
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      await sut.handleSharedSpaceLibraryFaceSync({ spaceId, libraryId });

      // Layer 1 hit — no embedding search should run
      expect(mocks.sharedSpace.findSpacePersonByLinkedPersonId).toHaveBeenCalledWith(spaceId, personalPersonId);
      expect(mocks.sharedSpace.findClosestSpacePerson).not.toHaveBeenCalled();
      expect(mocks.sharedSpace.addPersonFaces).toHaveBeenCalledWith(
        [{ personId: existingSpacePersonId, assetFaceId: faceId }],
        { skipRecount: true },
      );
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.SharedSpacePersonDedup,
        data: { spaceId },
      });
    });

    it('should create new space person only when no personId match exists', async () => {
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
      mocks.sharedSpace.findClosestSpacePerson.mockResolvedValue([]); // No embedding match
      mocks.sharedSpace.findSpacePersonByLinkedPersonId.mockResolvedValue(void 0 as any); // No personId match either
      mocks.sharedSpace.createPerson.mockResolvedValue(factory.sharedSpacePerson({ spaceId }));
      mocks.sharedSpace.addPersonFaces.mockResolvedValue([]);
      mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

      await sut.handleSharedSpaceLibraryFaceSync({ spaceId, libraryId });

      expect(mocks.sharedSpace.createPerson).toHaveBeenCalled();
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.SharedSpacePersonDedup,
        data: { spaceId },
      });
    });
  });

  describe('handleSharedSpacePersonDedup', () => {
    beforeEach(() => {
      mocks.sharedSpace.recountPersons.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.deleteOrphanedPersons.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.repairOrphanedRepresentativeFaces.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.getFirstFaceIdForPerson.mockResolvedValue(null);
    });

    it('should skip when space does not exist', async () => {
      mocks.sharedSpace.getById.mockResolvedValue(void 0);
      const result = await sut.handleSharedSpacePersonDedup({ spaceId: newUuid() });
      expect(result).toBe(JobStatus.Skipped);
    });

    it('should skip when face recognition is disabled', async () => {
      const spaceId = newUuid();
      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false }));
      const result = await sut.handleSharedSpacePersonDedup({ spaceId });
      expect(result).toBe(JobStatus.Skipped);
    });

    it('should succeed with no merges when space has no people', async () => {
      const spaceId = newUuid();
      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
      mocks.sharedSpace.getSpacePersonsWithEmbeddings.mockResolvedValue([]);

      const result = await sut.handleSharedSpacePersonDedup({ spaceId });
      expect(result).toBe(JobStatus.Success);
    });

    it('should merge two people of the same type when embedding match found', async () => {
      const spaceId = newUuid();
      const personA = newUuid();
      const personB = newUuid();

      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
      mocks.sharedSpace.getSpacePersonsWithEmbeddings
        .mockResolvedValueOnce([
          {
            id: personA,
            name: 'Alice',
            type: 'person',
            isHidden: false,
            faceCount: 5,
            representativeFaceId: null,
            embedding: '[0.1,0.2]',
          },
          {
            id: personB,
            name: '',
            type: 'person',
            isHidden: false,
            faceCount: 2,
            representativeFaceId: null,
            embedding: '[0.11,0.21]',
          },
        ])
        .mockResolvedValueOnce([
          {
            id: personA,
            name: 'Alice',
            type: 'person',
            isHidden: false,
            faceCount: 5,
            representativeFaceId: null,
            embedding: '[0.1,0.2]',
          },
        ]);
      mocks.sharedSpace.findClosestSpacePerson.mockImplementation(
        (_spaceId: string, _embedding: string, options: { excludePersonIds?: string[] }) => {
          if (options.excludePersonIds?.includes(personA)) {
            return Promise.resolve([{ personId: personB, name: '', distance: 0.1 }]);
          }
          if (options.excludePersonIds?.includes(personB)) {
            return Promise.resolve([{ personId: personA, name: 'Alice', distance: 0.1 }]);
          }
          return Promise.resolve([]);
        },
      );
      mocks.sharedSpace.reassignPersonFacesSafe.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.migrateAliases.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.updatePerson.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.deletePerson.mockResolvedValue(void 0 as any);

      const result = await sut.handleSharedSpacePersonDedup({ spaceId });
      expect(result).toBe(JobStatus.Success);
      expect(mocks.sharedSpace.reassignPersonFacesSafe).toHaveBeenCalledWith(personB, personA);
      expect(mocks.sharedSpace.deletePerson).toHaveBeenCalledWith(personB);
      expect(mocks.sharedSpace.recountPersons).toHaveBeenCalledWith([personA]);
      expect(mocks.sharedSpace.deleteOrphanedPersons).toHaveBeenCalledWith(spaceId);
    });

    it('should succeed with no merges when space has one person (self-exclusion)', async () => {
      const spaceId = newUuid();
      const personA = newUuid();

      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
      mocks.sharedSpace.getSpacePersonsWithEmbeddings.mockResolvedValue([
        {
          id: personA,
          name: 'Alice',
          type: 'person',
          isHidden: false,
          faceCount: 1,
          representativeFaceId: null,
          embedding: '[0.1,0.2]',
        },
      ]);
      mocks.sharedSpace.findClosestSpacePerson.mockResolvedValue([]);

      const result = await sut.handleSharedSpacePersonDedup({ spaceId });
      expect(result).toBe(JobStatus.Success);
      expect(mocks.sharedSpace.reassignPersonFacesSafe).not.toHaveBeenCalled();
    });

    it('should succeed with no merges when all persons are unique', async () => {
      const spaceId = newUuid();

      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
      mocks.sharedSpace.getSpacePersonsWithEmbeddings.mockResolvedValue([
        {
          id: newUuid(),
          name: 'Alice',
          type: 'person',
          isHidden: false,
          faceCount: 1,
          representativeFaceId: null,
          embedding: '[0.1,0.2]',
        },
        {
          id: newUuid(),
          name: 'Bob',
          type: 'person',
          isHidden: false,
          faceCount: 1,
          representativeFaceId: null,
          embedding: '[0.9,0.8]',
        },
      ]);
      mocks.sharedSpace.findClosestSpacePerson.mockResolvedValue([]);

      const result = await sut.handleSharedSpacePersonDedup({ spaceId });
      expect(result).toBe(JobStatus.Success);
      expect(mocks.sharedSpace.reassignPersonFacesSafe).not.toHaveBeenCalled();
    });

    it('should handle transitive merge chains (A matches B, B matches C)', async () => {
      const spaceId = newUuid();
      const personA = newUuid();
      const personB = newUuid();
      const personC = newUuid();

      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
      mocks.sharedSpace.getSpacePersonsWithEmbeddings
        .mockResolvedValueOnce([
          {
            id: personA,
            name: '',
            type: 'person',
            isHidden: false,
            faceCount: 3,
            representativeFaceId: null,
            embedding: '[0.1,0.2]',
          },
          {
            id: personB,
            name: '',
            type: 'person',
            isHidden: false,
            faceCount: 3,
            representativeFaceId: null,
            embedding: '[0.11,0.21]',
          },
          {
            id: personC,
            name: '',
            type: 'person',
            isHidden: false,
            faceCount: 3,
            representativeFaceId: null,
            embedding: '[0.12,0.22]',
          },
        ])
        .mockResolvedValueOnce([
          {
            id: personA,
            name: '',
            type: 'person',
            isHidden: false,
            faceCount: 3,
            representativeFaceId: null,
            embedding: '[0.1,0.2]',
          },
          {
            id: personC,
            name: '',
            type: 'person',
            isHidden: false,
            faceCount: 3,
            representativeFaceId: null,
            embedding: '[0.12,0.22]',
          },
        ])
        .mockResolvedValueOnce([
          {
            id: personA,
            name: '',
            type: 'person',
            isHidden: false,
            faceCount: 3,
            representativeFaceId: null,
            embedding: '[0.1,0.2]',
          },
        ]);
      let callCount = 0;
      mocks.sharedSpace.findClosestSpacePerson.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve([{ personId: personB, name: '', distance: 0.1 }]);
        }
        if (callCount === 2) {
          return Promise.resolve([]);
        }
        if (callCount === 3) {
          return Promise.resolve([{ personId: personC, name: '', distance: 0.15 }]);
        }
        return Promise.resolve([]);
      });
      mocks.sharedSpace.reassignPersonFacesSafe.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.migrateAliases.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.updatePerson.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.deletePerson.mockResolvedValue(void 0 as any);

      const result = await sut.handleSharedSpacePersonDedup({ spaceId });
      expect(result).toBe(JobStatus.Success);
      expect(mocks.sharedSpace.deletePerson).toHaveBeenCalledWith(personB);
      expect(mocks.sharedSpace.deletePerson).toHaveBeenCalledWith(personC);
    });

    it('should gracefully handle person deleted between fetch and merge (concurrent safety)', async () => {
      const spaceId = newUuid();
      const personA = newUuid();
      const personB = newUuid();

      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
      mocks.sharedSpace.getSpacePersonsWithEmbeddings
        .mockResolvedValueOnce([
          {
            id: personA,
            name: '',
            type: 'person',
            isHidden: false,
            faceCount: 5,
            representativeFaceId: null,
            embedding: '[0.1,0.2]',
          },
          {
            id: personB,
            name: '',
            type: 'person',
            isHidden: false,
            faceCount: 2,
            representativeFaceId: null,
            embedding: '[0.11,0.21]',
          },
        ])
        .mockResolvedValueOnce([]);
      mocks.sharedSpace.findClosestSpacePerson.mockResolvedValueOnce([{ personId: personB, name: '', distance: 0.1 }]);
      mocks.sharedSpace.reassignPersonFacesSafe.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.migrateAliases.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.updatePerson.mockRejectedValue(new Error('no result'));
      mocks.sharedSpace.deletePerson.mockResolvedValue(void 0 as any);

      const result = await sut.handleSharedSpacePersonDedup({ spaceId });
      expect(result).toBe(JobStatus.Success);
      expect(mocks.sharedSpace.deletePerson).toHaveBeenCalledWith(personB);
    });

    it('should skip match when findClosestSpacePerson returns a person already merged in this pass', async () => {
      const spaceId = newUuid();
      const personA = newUuid();
      const personB = newUuid();
      const personC = newUuid();

      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
      mocks.sharedSpace.getSpacePersonsWithEmbeddings
        .mockResolvedValueOnce([
          {
            id: personA,
            name: '',
            type: 'person',
            isHidden: false,
            faceCount: 3,
            representativeFaceId: null,
            embedding: '[0.1,0.2]',
          },
          {
            id: personB,
            name: '',
            type: 'person',
            isHidden: false,
            faceCount: 3,
            representativeFaceId: null,
            embedding: '[0.11,0.21]',
          },
          {
            id: personC,
            name: '',
            type: 'person',
            isHidden: false,
            faceCount: 3,
            representativeFaceId: null,
            embedding: '[0.12,0.22]',
          },
        ])
        .mockResolvedValueOnce([
          {
            id: personA,
            name: '',
            type: 'person',
            isHidden: false,
            faceCount: 3,
            representativeFaceId: null,
            embedding: '[0.1,0.2]',
          },
        ]);
      mocks.sharedSpace.findClosestSpacePerson
        .mockResolvedValueOnce([{ personId: personB, name: '', distance: 0.1 }])
        .mockResolvedValueOnce([{ personId: personB, name: '', distance: 0.1 }])
        .mockResolvedValue([]);
      mocks.sharedSpace.reassignPersonFacesSafe.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.migrateAliases.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.updatePerson.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.deletePerson.mockResolvedValue(void 0 as any);

      const result = await sut.handleSharedSpacePersonDedup({ spaceId });
      expect(result).toBe(JobStatus.Success);
      expect(mocks.sharedSpace.deletePerson).toHaveBeenCalledTimes(1);
      expect(mocks.sharedSpace.deletePerson).toHaveBeenCalledWith(personB);
    });

    it('should skip person that was already merged as a source earlier in same pass', async () => {
      const spaceId = newUuid();
      const personA = newUuid();
      const personB = newUuid();

      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
      mocks.sharedSpace.getSpacePersonsWithEmbeddings
        .mockResolvedValueOnce([
          {
            id: personA,
            name: '',
            type: 'person',
            isHidden: false,
            faceCount: 5,
            representativeFaceId: null,
            embedding: '[0.1,0.2]',
          },
          {
            id: personB,
            name: '',
            type: 'person',
            isHidden: false,
            faceCount: 2,
            representativeFaceId: null,
            embedding: '[0.11,0.21]',
          },
        ])
        .mockResolvedValueOnce([
          {
            id: personA,
            name: '',
            type: 'person',
            isHidden: false,
            faceCount: 5,
            representativeFaceId: null,
            embedding: '[0.1,0.2]',
          },
        ]);
      mocks.sharedSpace.findClosestSpacePerson
        .mockResolvedValueOnce([{ personId: personB, name: '', distance: 0.1 }])
        .mockResolvedValue([]);
      mocks.sharedSpace.reassignPersonFacesSafe.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.migrateAliases.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.updatePerson.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.deletePerson.mockResolvedValue(void 0 as any);

      const result = await sut.handleSharedSpacePersonDedup({ spaceId });
      expect(result).toBe(JobStatus.Success);
      expect(mocks.sharedSpace.reassignPersonFacesSafe).toHaveBeenCalledTimes(1);
    });

    it('should not merge people of different types', async () => {
      const spaceId = newUuid();
      const personA = newUuid();
      const petB = newUuid();

      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
      mocks.sharedSpace.getSpacePersonsWithEmbeddings.mockResolvedValue([
        {
          id: personA,
          name: '',
          type: 'person',
          isHidden: false,
          faceCount: 1,
          representativeFaceId: null,
          embedding: '[0.1,0.2]',
        },
        {
          id: petB,
          name: '',
          type: 'pet',
          isHidden: false,
          faceCount: 1,
          representativeFaceId: null,
          embedding: '[0.11,0.21]',
        },
      ]);
      mocks.sharedSpace.findClosestSpacePerson.mockResolvedValue([]);

      const result = await sut.handleSharedSpacePersonDedup({ spaceId });
      expect(result).toBe(JobStatus.Success);
      expect(mocks.sharedSpace.reassignPersonFacesSafe).not.toHaveBeenCalled();
      expect(mocks.sharedSpace.findClosestSpacePerson).toHaveBeenCalledWith(
        spaceId,
        expect.any(String),
        expect.objectContaining({ type: 'person' }),
      );
      expect(mocks.sharedSpace.findClosestSpacePerson).toHaveBeenCalledWith(
        spaceId,
        expect.any(String),
        expect.objectContaining({ type: 'pet' }),
      );
    });

    it('should preserve non-empty name when merging', async () => {
      const spaceId = newUuid();
      const personA = newUuid();
      const personB = newUuid();

      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
      mocks.sharedSpace.getSpacePersonsWithEmbeddings
        .mockResolvedValueOnce([
          {
            id: personA,
            name: '',
            type: 'person',
            isHidden: false,
            faceCount: 5,
            representativeFaceId: null,
            embedding: '[0.1,0.2]',
          },
          {
            id: personB,
            name: 'Alice',
            type: 'person',
            isHidden: false,
            faceCount: 2,
            representativeFaceId: null,
            embedding: '[0.11,0.21]',
          },
        ])
        .mockResolvedValueOnce([
          {
            id: personA,
            name: 'Alice',
            type: 'person',
            isHidden: false,
            faceCount: 5,
            representativeFaceId: null,
            embedding: '[0.1,0.2]',
          },
        ]);
      mocks.sharedSpace.findClosestSpacePerson.mockImplementation(
        (_spaceId: string, _embedding: string, options: { excludePersonIds?: string[] }) => {
          if (options.excludePersonIds?.includes(personA)) {
            return Promise.resolve([{ personId: personB, name: 'Alice', distance: 0.1 }]);
          }
          if (options.excludePersonIds?.includes(personB)) {
            return Promise.resolve([{ personId: personA, name: '', distance: 0.1 }]);
          }
          return Promise.resolve([]);
        },
      );
      mocks.sharedSpace.reassignPersonFacesSafe.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.migrateAliases.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.updatePerson.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.deletePerson.mockResolvedValue(void 0 as any);

      await sut.handleSharedSpacePersonDedup({ spaceId });

      expect(mocks.sharedSpace.updatePerson).toHaveBeenCalledWith(personA, expect.objectContaining({ name: 'Alice' }));
    });

    it('should make merged result visible if either person is visible', async () => {
      const spaceId = newUuid();
      const personA = newUuid();
      const personB = newUuid();

      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
      mocks.sharedSpace.getSpacePersonsWithEmbeddings
        .mockResolvedValueOnce([
          {
            id: personA,
            name: '',
            type: 'person',
            isHidden: true,
            faceCount: 5,
            representativeFaceId: null,
            embedding: '[0.1,0.2]',
          },
          {
            id: personB,
            name: '',
            type: 'person',
            isHidden: false,
            faceCount: 2,
            representativeFaceId: null,
            embedding: '[0.11,0.21]',
          },
        ])
        .mockResolvedValueOnce([
          {
            id: personA,
            name: '',
            type: 'person',
            isHidden: false,
            faceCount: 5,
            representativeFaceId: null,
            embedding: '[0.1,0.2]',
          },
        ]);
      mocks.sharedSpace.findClosestSpacePerson.mockImplementation(
        (_spaceId: string, _embedding: string, options: { excludePersonIds?: string[] }) => {
          if (options.excludePersonIds?.includes(personA)) {
            return Promise.resolve([{ personId: personB, name: '', distance: 0.1 }]);
          }
          if (options.excludePersonIds?.includes(personB)) {
            return Promise.resolve([{ personId: personA, name: '', distance: 0.1 }]);
          }
          return Promise.resolve([]);
        },
      );
      mocks.sharedSpace.reassignPersonFacesSafe.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.migrateAliases.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.updatePerson.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.deletePerson.mockResolvedValue(void 0 as any);

      await sut.handleSharedSpacePersonDedup({ spaceId });

      expect(mocks.sharedSpace.updatePerson).toHaveBeenCalledWith(
        personA,
        expect.objectContaining({ isHidden: false }),
      );
    });

    it('should abort after MAX_PASSES to prevent infinite loop', async () => {
      const spaceId = newUuid();
      const personA = newUuid();
      const personB = newUuid();

      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
      // Always return same 2 persons — simulates bug where deleted person keeps reappearing
      mocks.sharedSpace.getSpacePersonsWithEmbeddings.mockResolvedValue([
        {
          id: personA,
          name: '',
          type: 'person',
          isHidden: false,
          faceCount: 1,
          representativeFaceId: null,
          embedding: '[0.1,0.2]',
        },
        {
          id: personB,
          name: '',
          type: 'person',
          isHidden: false,
          faceCount: 1,
          representativeFaceId: null,
          embedding: '[0.11,0.21]',
        },
      ]);
      mocks.sharedSpace.findClosestSpacePerson.mockResolvedValue([{ personId: personB, name: '', distance: 0.1 }]);
      mocks.sharedSpace.reassignPersonFacesSafe.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.migrateAliases.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.updatePerson.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.deletePerson.mockResolvedValue(void 0 as any);

      const result = await sut.handleSharedSpacePersonDedup({ spaceId });
      expect(result).toBe(JobStatus.Success);
      // Should have been called many times but eventually stopped
      expect(mocks.sharedSpace.deletePerson).toHaveBeenCalled();
    });

    it('should clean up orphaned persons even with no merges', async () => {
      const spaceId = newUuid();
      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
      mocks.sharedSpace.getSpacePersonsWithEmbeddings.mockResolvedValue([]);

      const result = await sut.handleSharedSpacePersonDedup({ spaceId });
      expect(result).toBe(JobStatus.Success);
      expect(mocks.sharedSpace.deleteOrphanedPersons).toHaveBeenCalledWith(spaceId);
    });

    it('should update representativeFaceId on target after merge', async () => {
      const spaceId = newUuid();
      const personA = newUuid();
      const personB = newUuid();
      const newFaceId = newUuid();

      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
      mocks.sharedSpace.getSpacePersonsWithEmbeddings
        .mockResolvedValueOnce([
          {
            id: personA,
            name: 'Alice',
            type: 'person',
            isHidden: false,
            faceCount: 5,
            representativeFaceId: null,
            embedding: '[0.1,0.2]',
          },
          {
            id: personB,
            name: '',
            type: 'person',
            isHidden: false,
            faceCount: 2,
            representativeFaceId: null,
            embedding: '[0.11,0.21]',
          },
        ])
        .mockResolvedValueOnce([
          {
            id: personA,
            name: 'Alice',
            type: 'person',
            isHidden: false,
            faceCount: 7,
            representativeFaceId: null,
            embedding: '[0.1,0.2]',
          },
        ]);
      mocks.sharedSpace.findClosestSpacePerson.mockImplementation(
        (_spaceId: string, _embedding: string, options: { excludePersonIds?: string[] }) => {
          if (options.excludePersonIds?.includes(personA)) {
            return Promise.resolve([{ personId: personB, name: '', distance: 0.1 }]);
          }
          return Promise.resolve([]);
        },
      );
      mocks.sharedSpace.reassignPersonFacesSafe.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.migrateAliases.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.updatePerson.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.deletePerson.mockResolvedValue(void 0 as any);
      mocks.sharedSpace.getFirstFaceIdForPerson.mockResolvedValue(newFaceId);

      const result = await sut.handleSharedSpacePersonDedup({ spaceId });
      expect(result).toBe(JobStatus.Success);
      expect(mocks.sharedSpace.getFirstFaceIdForPerson).toHaveBeenCalledWith(personA);
      expect(mocks.sharedSpace.updatePerson).toHaveBeenCalledWith(personA, { representativeFaceId: newFaceId });
    });

    it('should repair orphaned representativeFaceIds before dedup loop', async () => {
      const spaceId = newUuid();
      mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
      mocks.sharedSpace.getSpacePersonsWithEmbeddings.mockResolvedValue([]);
      mocks.sharedSpace.repairOrphanedRepresentativeFaces.mockResolvedValue(void 0 as any);

      const result = await sut.handleSharedSpacePersonDedup({ spaceId });
      expect(result).toBe(JobStatus.Success);
      expect(mocks.sharedSpace.repairOrphanedRepresentativeFaces).toHaveBeenCalledWith(spaceId);
      // Repair should be called BEFORE getSpacePersonsWithEmbeddings
      const repairOrder = mocks.sharedSpace.repairOrphanedRepresentativeFaces.mock.invocationCallOrder[0];
      const embeddingsOrder = mocks.sharedSpace.getSpacePersonsWithEmbeddings.mock.invocationCallOrder[0];
      expect(repairOrder).toBeLessThan(embeddingsOrder);
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

  describe('getFilteredMapMarkers', () => {
    it('should return filtered map markers for the authenticated user', async () => {
      const auth = factory.auth();
      mocks.sharedSpace.getFilteredMapMarkers.mockResolvedValue([
        { id: 'asset-1', lat: 48.8566, lon: 2.3522, city: 'Paris', state: 'Île-de-France', country: 'France' },
      ] as any);

      const result = await sut.getFilteredMapMarkers(auth, { personIds: ['person-1'] });

      expect(result).toEqual([
        { id: 'asset-1', lat: 48.8566, lon: 2.3522, city: 'Paris', state: 'Île-de-France', country: 'France' },
      ]);
      expect(mocks.sharedSpace.getFilteredMapMarkers).toHaveBeenCalledWith(
        expect.objectContaining({
          userIds: [auth.user.id],
          personIds: ['person-1'],
          visibility: expect.anything(),
        }),
      );
    });

    it('should scope to space when spaceId is provided', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();

      mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set([spaceId]));
      mocks.sharedSpace.getFilteredMapMarkers.mockResolvedValue([]);

      await sut.getFilteredMapMarkers(auth, { spaceId });

      expect(mocks.sharedSpace.getFilteredMapMarkers).toHaveBeenCalledWith(
        expect.objectContaining({
          spaceId,
          userIds: undefined,
        }),
      );
    });

    it('should throw when user lacks space access', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();

      mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set());

      await expect(sut.getFilteredMapMarkers(auth, { spaceId })).rejects.toThrow();
    });

    it('should pass personMatchAny and tagMatchAny flags to repository', async () => {
      const auth = factory.auth();
      mocks.sharedSpace.getFilteredMapMarkers.mockResolvedValue([]);

      await sut.getFilteredMapMarkers(auth, {
        personIds: ['person-1'],
        tagIds: ['tag-1'],
      });

      expect(mocks.sharedSpace.getFilteredMapMarkers).toHaveBeenCalledWith(
        expect.objectContaining({
          personIds: ['person-1'],
          tagIds: ['tag-1'],
          personMatchAny: true,
          tagMatchAny: true,
        }),
      );
    });

    it('should pass personMatchAny for space person IDs', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set([spaceId]));
      mocks.sharedSpace.getFilteredMapMarkers.mockResolvedValue([]);

      await sut.getFilteredMapMarkers(auth, { spaceId, personIds: ['person-1'] });

      expect(mocks.sharedSpace.getFilteredMapMarkers).toHaveBeenCalledWith(
        expect.objectContaining({
          spacePersonIds: ['person-1'],
          personMatchAny: true,
          tagMatchAny: true,
        }),
      );
    });

    it('should pass city and country to repository', async () => {
      const auth = factory.auth();
      mocks.sharedSpace.getFilteredMapMarkers.mockResolvedValue([]);

      await sut.getFilteredMapMarkers(auth, { city: 'Paris', country: 'France' });

      expect(mocks.sharedSpace.getFilteredMapMarkers).toHaveBeenCalledWith(
        expect.objectContaining({
          city: 'Paris',
          country: 'France',
        }),
      );
    });

    it('should pass all filters together to repository', async () => {
      const auth = factory.auth();
      mocks.sharedSpace.getFilteredMapMarkers.mockResolvedValue([]);

      await sut.getFilteredMapMarkers(auth, {
        personIds: ['person-1'],
        tagIds: ['tag-1'],
        city: 'Paris',
        country: 'France',
        rating: 4,
        make: 'Canon',
      });

      expect(mocks.sharedSpace.getFilteredMapMarkers).toHaveBeenCalledWith(
        expect.objectContaining({
          personIds: ['person-1'],
          tagIds: ['tag-1'],
          city: 'Paris',
          country: 'France',
          rating: 4,
          make: 'Canon',
          personMatchAny: true,
          tagMatchAny: true,
        }),
      );
    });

    it('should map undefined city/state/country to null', async () => {
      const auth = factory.auth();

      mocks.sharedSpace.getFilteredMapMarkers.mockResolvedValue([
        { id: 'asset-1', lat: 0, lon: 0, city: null, state: null, country: null },
      ] as any);

      const result = await sut.getFilteredMapMarkers(auth, {});

      expect(result[0].city).toBeNull();
      expect(result[0].state).toBeNull();
      expect(result[0].country).toBeNull();
    });

    it('should resolve timelineSpaceIds when withSharedSpaces is true and no spaceId', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      mocks.sharedSpace.getSpaceIdsForTimeline.mockResolvedValue([{ spaceId }]);
      mocks.sharedSpace.getFilteredMapMarkers.mockResolvedValue([]);

      await sut.getFilteredMapMarkers(auth, { withSharedSpaces: true });

      expect(mocks.sharedSpace.getSpaceIdsForTimeline).toHaveBeenCalledWith(auth.user.id);
      expect(mocks.sharedSpace.getFilteredMapMarkers).toHaveBeenCalledWith(
        expect.objectContaining({
          userIds: [auth.user.id],
          timelineSpaceIds: [spaceId],
        }),
      );
    });

    it('should NOT call getSpaceIdsForTimeline when spaceId is set (even with withSharedSpaces=true)', async () => {
      const auth = factory.auth();
      const spaceId = newUuid();
      mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set([spaceId]));
      mocks.sharedSpace.getFilteredMapMarkers.mockResolvedValue([]);

      await sut.getFilteredMapMarkers(auth, { spaceId, withSharedSpaces: true });

      expect(mocks.sharedSpace.getSpaceIdsForTimeline).not.toHaveBeenCalled();
      expect(mocks.sharedSpace.getFilteredMapMarkers).toHaveBeenCalledWith(
        expect.not.objectContaining({ timelineSpaceIds: expect.anything() }),
      );
    });

    it('should not resolve timelineSpaceIds when isFavorite=true', async () => {
      const auth = factory.auth();
      mocks.sharedSpace.getFilteredMapMarkers.mockResolvedValue([]);

      await sut.getFilteredMapMarkers(auth, { withSharedSpaces: true, isFavorite: true });

      expect(mocks.sharedSpace.getSpaceIdsForTimeline).not.toHaveBeenCalled();
    });

    it('should not resolve timelineSpaceIds when withSharedSpaces is omitted', async () => {
      const auth = factory.auth();
      mocks.sharedSpace.getFilteredMapMarkers.mockResolvedValue([]);

      await sut.getFilteredMapMarkers(auth, {});

      expect(mocks.sharedSpace.getSpaceIdsForTimeline).not.toHaveBeenCalled();
    });

    it('should pass personIds as global (not spacePersonIds) when no spaceId + withSharedSpaces=true', async () => {
      const auth = factory.auth();
      mocks.sharedSpace.getSpaceIdsForTimeline.mockResolvedValue([{ spaceId: newUuid() }]);
      mocks.sharedSpace.getFilteredMapMarkers.mockResolvedValue([]);

      await sut.getFilteredMapMarkers(auth, {
        withSharedSpaces: true,
        personIds: ['person-1'],
      });

      expect(mocks.sharedSpace.getFilteredMapMarkers).toHaveBeenCalledWith(
        expect.objectContaining({
          personIds: ['person-1'],
          spacePersonIds: undefined,
        }),
      );
    });

    it('should NOT leak other-space content when spaceId is set (row 19)', async () => {
      const auth = factory.auth();
      const spaceB = newUuid();

      mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set([spaceB]));
      mocks.sharedSpace.getFilteredMapMarkers.mockResolvedValue([]);

      await sut.getFilteredMapMarkers(auth, { spaceId: spaceB, withSharedSpaces: true });

      // With spaceId set, the service must scope only to that space — no userIds, no timelineSpaceIds.
      expect(mocks.sharedSpace.getFilteredMapMarkers).toHaveBeenCalledWith(
        expect.objectContaining({
          spaceId: spaceB,
          userIds: undefined,
        }),
      );
      expect(mocks.sharedSpace.getFilteredMapMarkers).toHaveBeenCalledWith(
        expect.not.objectContaining({ timelineSpaceIds: expect.anything() }),
      );
    });
  });

  describe('deduplicateSpacePeople', () => {
    it('should require owner role', async () => {
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));

      await expect(sut.deduplicateSpacePeople(factory.auth(), newUuid())).rejects.toThrow(ForbiddenException);
    });

    it('should queue dedup job for owner', async () => {
      const spaceId = newUuid();
      mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Owner }));

      await sut.deduplicateSpacePeople(factory.auth(), spaceId);

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.SharedSpacePersonDedup,
        data: { spaceId },
      });
    });
  });
});
