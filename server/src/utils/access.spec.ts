import { UnauthorizedException } from '@nestjs/common';
import { AuthDto } from 'src/dtos/auth.dto';
import { Permission } from 'src/enum';
import { checkAccess, requireElevatedPermission } from 'src/utils/access';
import { newAccessRepositoryMock } from 'test/repositories/access.repository.mock';
import { newUuid } from 'test/small.factory';

const makeAuth = (userId?: string): AuthDto => ({
  user: {
    id: userId ?? newUuid(),
    isAdmin: false,
    name: 'test',
    email: 'test@test.com',
    quotaUsageInBytes: 0,
    quotaSizeInBytes: null,
  },
});

describe('requireElevatedPermission', () => {
  it('should throw UnauthorizedException when session has no elevated permission', () => {
    const auth: AuthDto = {
      user: {
        id: newUuid(),
        isAdmin: false,
        name: 'test',
        email: 'test@test.com',
        quotaUsageInBytes: 0,
        quotaSizeInBytes: null,
      },
      session: { id: newUuid(), hasElevatedPermission: false },
    };

    expect(() => requireElevatedPermission(auth)).toThrow(UnauthorizedException);
    expect(() => requireElevatedPermission(auth)).toThrow('Elevated permission is required');
  });

  it('should throw UnauthorizedException when session is undefined', () => {
    const auth: AuthDto = {
      user: {
        id: newUuid(),
        isAdmin: false,
        name: 'test',
        email: 'test@test.com',
        quotaUsageInBytes: 0,
        quotaSizeInBytes: null,
      },
    };

    expect(() => requireElevatedPermission(auth)).toThrow(UnauthorizedException);
  });

  it('should not throw when session has elevated permission', () => {
    const auth: AuthDto = {
      user: {
        id: newUuid(),
        isAdmin: false,
        name: 'test',
        email: 'test@test.com',
        quotaUsageInBytes: 0,
        quotaSizeInBytes: null,
      },
      session: { id: newUuid(), hasElevatedPermission: true },
    };

    expect(() => requireElevatedPermission(auth)).not.toThrow();
  });
});

describe('checkOtherAccess SharedSpaceRead', () => {
  it('should check member access for SharedSpaceRead', async () => {
    const accessMock = newAccessRepositoryMock();
    const userId = newUuid();
    const spaceId = newUuid();
    const auth: AuthDto = {
      user: {
        id: userId,
        isAdmin: false,
        name: 'test',
        email: 'test@test.com',
        quotaUsageInBytes: 0,
        quotaSizeInBytes: null,
      },
    };

    accessMock.sharedSpace.checkMemberAccess.mockResolvedValue(new Set([spaceId]));

    const result = await checkAccess(accessMock as any, {
      auth,
      permission: Permission.SharedSpaceRead,
      ids: new Set([spaceId]),
    });

    expect(result).toEqual(new Set([spaceId]));
    expect(accessMock.sharedSpace.checkMemberAccess).toHaveBeenCalledWith(userId, new Set([spaceId]));
  });

  it('should return an empty set when user is not a member', async () => {
    const accessMock = newAccessRepositoryMock();
    const userId = newUuid();
    const spaceId = newUuid();
    const auth: AuthDto = {
      user: {
        id: userId,
        isAdmin: false,
        name: 'test',
        email: 'test@test.com',
        quotaUsageInBytes: 0,
        quotaSizeInBytes: null,
      },
    };

    const result = await checkAccess(accessMock as any, {
      auth,
      permission: Permission.SharedSpaceRead,
      ids: new Set([spaceId]),
    });

    expect(result).toEqual(new Set());
    expect(accessMock.sharedSpace.checkMemberAccess).toHaveBeenCalledWith(userId, new Set([spaceId]));
  });
});

describe('space asset access via checkOtherAccess', () => {
  describe('AssetRead', () => {
    it('should grant access when asset is in a space the user is a member of', async () => {
      const accessMock = newAccessRepositoryMock();
      const auth = makeAuth();
      const assetId = newUuid();

      accessMock.asset.checkSpaceAccess.mockResolvedValue(new Set([assetId]));

      const result = await checkAccess(accessMock as any, {
        auth,
        permission: Permission.AssetRead,
        ids: new Set([assetId]),
      });

      expect(result).toEqual(new Set([assetId]));
    });

    it('should deny access when asset is not in any space the user belongs to', async () => {
      const accessMock = newAccessRepositoryMock();
      const auth = makeAuth();
      const assetId = newUuid();

      const result = await checkAccess(accessMock as any, {
        auth,
        permission: Permission.AssetRead,
        ids: new Set([assetId]),
      });

      expect(result).toEqual(new Set());
    });

    it('should not call checkSpaceAccess when owner access already granted', async () => {
      const accessMock = newAccessRepositoryMock();
      const auth = makeAuth();
      const assetId = newUuid();

      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));

      await checkAccess(accessMock as any, {
        auth,
        permission: Permission.AssetRead,
        ids: new Set([assetId]),
      });

      expect(accessMock.asset.checkSpaceAccess).toHaveBeenCalledWith(auth.user.id, new Set());
    });

    it('should not call checkSpaceAccess when album access already granted', async () => {
      const accessMock = newAccessRepositoryMock();
      const auth = makeAuth();
      const assetId = newUuid();

      accessMock.asset.checkAlbumAccess.mockResolvedValue(new Set([assetId]));

      await checkAccess(accessMock as any, {
        auth,
        permission: Permission.AssetRead,
        ids: new Set([assetId]),
      });

      expect(accessMock.asset.checkSpaceAccess).toHaveBeenCalledWith(auth.user.id, new Set());
    });

    it('should not call checkSpaceAccess when partner access already granted', async () => {
      const accessMock = newAccessRepositoryMock();
      const auth = makeAuth();
      const assetId = newUuid();

      accessMock.asset.checkPartnerAccess.mockResolvedValue(new Set([assetId]));

      await checkAccess(accessMock as any, {
        auth,
        permission: Permission.AssetRead,
        ids: new Set([assetId]),
      });

      expect(accessMock.asset.checkSpaceAccess).toHaveBeenCalledWith(auth.user.id, new Set());
    });

    it('should check space access for assets not covered by owner/album/partner', async () => {
      const accessMock = newAccessRepositoryMock();
      const auth = makeAuth();
      const ownedAsset = newUuid();
      const spaceAsset = newUuid();

      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set([ownedAsset]));
      accessMock.asset.checkSpaceAccess.mockResolvedValue(new Set([spaceAsset]));

      const result = await checkAccess(accessMock as any, {
        auth,
        permission: Permission.AssetRead,
        ids: new Set([ownedAsset, spaceAsset]),
      });

      expect(result).toEqual(new Set([ownedAsset, spaceAsset]));
      expect(accessMock.asset.checkSpaceAccess).toHaveBeenCalledWith(auth.user.id, new Set([spaceAsset]));
    });
  });

  describe('AssetView', () => {
    it('should grant access when asset is in a space the user is a member of', async () => {
      const accessMock = newAccessRepositoryMock();
      const auth = makeAuth();
      const assetId = newUuid();

      accessMock.asset.checkSpaceAccess.mockResolvedValue(new Set([assetId]));

      const result = await checkAccess(accessMock as any, {
        auth,
        permission: Permission.AssetView,
        ids: new Set([assetId]),
      });

      expect(result).toEqual(new Set([assetId]));
    });

    it('should deny access when asset is not in any space the user belongs to', async () => {
      const accessMock = newAccessRepositoryMock();
      const auth = makeAuth();
      const assetId = newUuid();

      const result = await checkAccess(accessMock as any, {
        auth,
        permission: Permission.AssetView,
        ids: new Set([assetId]),
      });

      expect(result).toEqual(new Set());
    });
  });

  describe('AssetDownload', () => {
    it('should grant access when asset is in a space the user is a member of', async () => {
      const accessMock = newAccessRepositoryMock();
      const auth = makeAuth();
      const assetId = newUuid();

      accessMock.asset.checkSpaceAccess.mockResolvedValue(new Set([assetId]));

      const result = await checkAccess(accessMock as any, {
        auth,
        permission: Permission.AssetDownload,
        ids: new Set([assetId]),
      });

      expect(result).toEqual(new Set([assetId]));
    });

    it('should deny access when asset is not in any space the user belongs to', async () => {
      const accessMock = newAccessRepositoryMock();
      const auth = makeAuth();
      const assetId = newUuid();

      const result = await checkAccess(accessMock as any, {
        auth,
        permission: Permission.AssetDownload,
        ids: new Set([assetId]),
      });

      expect(result).toEqual(new Set());
    });
  });

  describe('AssetUpdate (owner-only, space should NOT grant)', () => {
    it('should not grant update access via space membership', async () => {
      const accessMock = newAccessRepositoryMock();
      const auth = makeAuth();
      const assetId = newUuid();

      // Space access doesn't apply to AssetUpdate — only owner can update
      const result = await checkAccess(accessMock as any, {
        auth,
        permission: Permission.AssetUpdate,
        ids: new Set([assetId]),
      });

      expect(result).toEqual(new Set());
    });
  });

  describe('AssetDelete (owner-only, space should NOT grant)', () => {
    it('should not grant delete access via space membership', async () => {
      const accessMock = newAccessRepositoryMock();
      const auth = makeAuth();
      const assetId = newUuid();

      const result = await checkAccess(accessMock as any, {
        auth,
        permission: Permission.AssetDelete,
        ids: new Set([assetId]),
      });

      expect(result).toEqual(new Set());
    });
  });

  describe('AssetShare (space should NOT grant)', () => {
    it('should not grant share access via space membership', async () => {
      const accessMock = newAccessRepositoryMock();
      const auth = makeAuth();
      const assetId = newUuid();

      const result = await checkAccess(accessMock as any, {
        auth,
        permission: Permission.AssetShare,
        ids: new Set([assetId]),
      });

      expect(result).toEqual(new Set());
    });
  });
});

describe('checkOtherAccess default case', () => {
  it('should return an empty set for an unhandled permission', async () => {
    const accessMock = newAccessRepositoryMock();
    const auth: AuthDto = {
      user: {
        id: newUuid(),
        isAdmin: false,
        name: 'test',
        email: 'test@test.com',
        quotaUsageInBytes: 0,
        quotaSizeInBytes: null,
      },
    };

    // Use a permission value that is not handled in the switch statement
    // Permission.All is not handled in checkOtherAccess and should fall through to default
    const result = await checkAccess(accessMock as any, {
      auth,
      permission: Permission.All,
      ids: new Set([newUuid()]),
    });

    expect(result).toEqual(new Set());
  });
});
