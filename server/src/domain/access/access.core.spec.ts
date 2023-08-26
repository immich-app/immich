import { IAccessRepositoryMock, newAccessRepositoryMock } from '@test';
import { AccessCore, Permission } from '.';
import { AuthUserDto } from '..';

describe(AccessCore.name, () => {
  let sut: AccessCore;
  let accessMock: jest.Mocked<IAccessRepositoryMock>;
  let publicUser: AuthUserDto;
  let user: AuthUserDto;

  beforeEach(() => {
    accessMock = newAccessRepositoryMock();
    sut = new AccessCore(accessMock);
    publicUser = {
      id: '123',
      email: 'test@immich.com',
      isAdmin: false,
      isPublicUser: true,
      sharedLinkId: '1234',
    } as AuthUserDto;
    user = {
      id: '123',
      email: 'test@immich.com',
      isAdmin: false,
    };
  });

  it('should be defined', () => {
    expect(sut).toBeDefined;
  });

  describe('hasPermission:hasSharedLinksAccess', () => {
    it('should return false if public user has no shared link', async () => {
      publicUser = { id: '123', email: 'test@immich.com', isAdmin: false, isPublicUser: true } as AuthUserDto;
      await expect(sut.hasPermission(publicUser, Permission.ASSET_VIEW, '12345')).resolves.toBe(false);
    });

    it('should return false if public user with modifiable permissions', async () => {
      await expect(sut.hasPermission(publicUser, Permission.ASSET_DELETE, '12345')).resolves.toBe(false);
    });

    it('should return true if public user has read permission for asset', async () => {
      accessMock.asset.hasSharedLinkAccess.mockResolvedValue(true);

      await expect(sut.hasPermission(publicUser, Permission.ASSET_READ, '12345')).resolves.toBe(true);
      expect(accessMock.asset.hasSharedLinkAccess).toBeCalledWith(publicUser.sharedLinkId, '12345');
    });

    it.each([{ permission: Permission.ASSET_READ }, { permission: Permission.ASSET_VIEW }])(
      'should return true if public user has $permission permission',
      async ({ permission }) => {
        accessMock.asset.hasSharedLinkAccess.mockResolvedValue(true);

        await expect(sut.hasPermission(publicUser, permission, '12345')).resolves.toBe(true);
        expect(accessMock.asset.hasSharedLinkAccess).toBeCalledWith(publicUser.sharedLinkId, '12345');
      },
    );

    it('should return true if public user has read permission for album', async () => {
      accessMock.album.hasSharedLinkAccess.mockResolvedValue(true);

      await expect(sut.hasPermission(publicUser, Permission.ALBUM_READ, '12345')).resolves.toBe(true);
      expect(accessMock.album.hasSharedLinkAccess).toBeCalledWith(publicUser.sharedLinkId, '12345');
    });

    it('should return false if auth user is not allowed to download asset or album but tries to', async () => {
      accessMock.asset.hasSharedLinkAccess.mockResolvedValue(true);
      accessMock.album.hasSharedLinkAccess.mockResolvedValue(true);

      await expect(sut.hasPermission(publicUser, Permission.ASSET_DOWNLOAD, '12345')).resolves.toBe(false);
      expect(accessMock.asset.hasSharedLinkAccess).not.toBeCalledWith(publicUser.sharedLinkId, '12345');

      await expect(sut.hasPermission(publicUser, Permission.ALBUM_DOWNLOAD, '12345')).resolves.toBe(false);
      expect(accessMock.album.hasSharedLinkAccess).not.toBeCalledWith(publicUser.sharedLinkId, '12345');
    });

    it('should return true if public user is allowed to download asset or album', async () => {
      accessMock.asset.hasSharedLinkAccess.mockResolvedValue(true);
      accessMock.album.hasSharedLinkAccess.mockResolvedValue(true);
      publicUser.isAllowDownload = true;

      await expect(sut.hasPermission(publicUser, Permission.ASSET_DOWNLOAD, '12345')).resolves.toBe(true);
      expect(accessMock.asset.hasSharedLinkAccess).toBeCalledWith(publicUser.sharedLinkId, '12345');

      await expect(sut.hasPermission(publicUser, Permission.ALBUM_DOWNLOAD, '12345')).resolves.toBe(true);
      expect(accessMock.album.hasSharedLinkAccess).toBeCalledWith(publicUser.sharedLinkId, '12345');
    });
  });

  describe('hasPermission:hasOtherAccess', () => {
    it.each([
      Permission.ASSET_READ,
      Permission.ASSET_UPDATE,
      Permission.ASSET_DELETE,
      Permission.ASSET_SHARE,
      Permission.ASSET_VIEW,
      Permission.ASSET_DOWNLOAD,
      // Permission.ALBUM_READ,
      // Permission.ALBUM_UPDATE,
      // Permission.ALBUM_DELETE,
      // Permission.ALBUM_SHARE,
      // Permission.ALBUM_DOWNLOAD,
      // Permission.ALBUM_REMOVE_ASSET,
    ])('should return true if user has owner access and tries to do anything with assets', async (permission) => {
      accessMock.asset.hasOwnerAccess.mockResolvedValue(true);

      await expect(sut.hasPermission(user, permission, '12345')).resolves.toBe(true);
      expect(accessMock.asset.hasOwnerAccess).toBeCalledWith(user.id, '12345');
    });

    it.each([
      Permission.ALBUM_READ,
      Permission.ALBUM_UPDATE,
      Permission.ALBUM_DELETE,
      Permission.ALBUM_SHARE,
      Permission.ALBUM_DOWNLOAD,
      Permission.ALBUM_REMOVE_ASSET,
    ])('should return true if user has owner access and tries to do anything with albums', async (permission) => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(true);

      await expect(sut.hasPermission(user, permission, '12345')).resolves.toBe(true);
      expect(accessMock.album.hasOwnerAccess).toBeCalledWith(user.id, '12345');
    });

    it.each([Permission.ARCHIVE_READ, Permission.LIBRARY_READ, Permission.LIBRARY_DOWNLOAD])(
      'should return true if user id matches the library/archive id and user tries to do stuff on them',
      async (permission) => {
        await expect(sut.hasPermission(user, permission, '123')).resolves.toBe(true);
      },
    );

    it.each([Permission.ASSET_READ, Permission.ASSET_SHARE, Permission.ASSET_VIEW, Permission.ASSET_DOWNLOAD])(
      'should return true if partner has access and non-modifying permissions for an asset',
      async (permission) => {
        accessMock.asset.hasPartnerAccess.mockResolvedValue(true);

        await expect(sut.hasPermission(user, permission, '12345')).resolves.toBe(true);
        expect(accessMock.asset.hasPartnerAccess).toBeCalledWith(user.id, '12345');
      },
    );

    it('should return true if partner has (reading) access to the library', async () => {
      accessMock.library.hasPartnerAccess.mockResolvedValue(true);

      await expect(sut.hasPermission(user, Permission.LIBRARY_READ, '12345')).resolves.toBe(true);
      expect(accessMock.library.hasPartnerAccess).toBeCalledWith(user.id, '12345');
    });

    it.each([Permission.ALBUM_READ, Permission.ALBUM_DOWNLOAD])(
      'should return true if user has shared album access and tries to read or download the album',
      async (permission) => {
        accessMock.album.hasSharedAlbumAccess.mockResolvedValue(true);

        await expect(sut.hasPermission(user, permission, '12345')).resolves.toBe(true);
        expect(accessMock.album.hasSharedAlbumAccess).toBeCalledWith(user.id, '12345');
      },
    );

    it.each([Permission.ASSET_READ, Permission.ASSET_VIEW, Permission.ASSET_DOWNLOAD])(
      'should return true if user has album access and tries to view or download an asset',
      async (permission) => {
        accessMock.asset.hasAlbumAccess.mockResolvedValue(true);

        await expect(sut.hasPermission(user, permission, '12345')).resolves.toBe(true);
        expect(accessMock.asset.hasAlbumAccess).toBeCalledWith(user.id, '12345');
      },
    );

    it('should return false if unknown permission if unknown permission is requested', async () => {
      await expect(sut.hasPermission(user, '' as Permission, '123')).resolves.toBe(false);
    });
  });
});
