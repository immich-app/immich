export const IAccessRepository = 'IAccessRepository';

export interface IAccessRepository {
  activity: {
    hasOwnerAccess(userId: string, activityId: string): Promise<boolean>;
    hasAlbumOwnerAccess(userId: string, activityId: string): Promise<boolean>;
    hasCreateAccess(userId: string, albumId: string): Promise<boolean>;
  };
  asset: {
    hasOwnerAccess(userId: string, assetId: string): Promise<boolean>;
    hasAlbumAccess(userId: string, assetId: string): Promise<boolean>;
    hasPartnerAccess(userId: string, assetId: string): Promise<boolean>;
    hasSharedLinkAccess(sharedLinkId: string, assetId: string): Promise<boolean>;
  };

  authDevice: {
    hasOwnerAccess(userId: string, deviceId: string): Promise<boolean>;
  };

  album: {
    hasOwnerAccess(userId: string, albumId: string): Promise<boolean>;
    hasSharedAlbumAccess(userId: string, albumId: string): Promise<boolean>;
    hasSharedLinkAccess(sharedLinkId: string, albumId: string): Promise<boolean>;
  };

  library: {
    hasOwnerAccess(userId: string, libraryId: string): Promise<boolean>;
    hasPartnerAccess(userId: string, partnerId: string): Promise<boolean>;
  };

  timeline: {
    hasPartnerAccess(userId: string, partnerId: string): Promise<boolean>;
  };

  person: {
    hasOwnerAccess(userId: string, personId: string): Promise<boolean>;
  };
}
