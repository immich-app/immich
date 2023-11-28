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
    checkOwnerAccess(userId: string, deviceIds: Set<string>): Promise<Set<string>>;
  };

  album: {
    checkOwnerAccess(userId: string, albumIds: Set<string>): Promise<Set<string>>;
    checkSharedAlbumAccess(userId: string, albumIds: Set<string>): Promise<Set<string>>;
    checkSharedLinkAccess(sharedLinkId: string, albumIds: Set<string>): Promise<Set<string>>;
  };

  library: {
    checkOwnerAccess(userId: string, libraryIds: Set<string>): Promise<Set<string>>;
    checkPartnerAccess(userId: string, partnerIds: Set<string>): Promise<Set<string>>;
  };

  timeline: {
    checkPartnerAccess(userId: string, partnerIds: Set<string>): Promise<Set<string>>;
  };

  person: {
    checkOwnerAccess(userId: string, personIds: Set<string>): Promise<Set<string>>;
  };

  partner: {
    checkUpdateAccess(userId: string, partnerIds: Set<string>): Promise<Set<string>>;
  };
}
