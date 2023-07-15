export const IAccessRepository = 'IAccessRepository';

export interface IAccessRepository {
  asset: {
    hasOwnerAccess(userId: string, assetId: string): Promise<boolean>;
    hasAlbumAccess(userId: string, assetId: string): Promise<boolean>;
    hasPartnerAccess(userId: string, assetId: string): Promise<boolean>;
    hasSharedLinkAccess(sharedLinkId: string, assetId: string): Promise<boolean>;
  };

  album: {
    hasOwnerAccess(userId: string, albumId: string): Promise<boolean>;
    hasSharedAlbumAccess(userId: string, albumId: string): Promise<boolean>;
    hasSharedLinkAccess(sharedLinkId: string, albumId: string): Promise<boolean>;
  };

  library: {
    hasPartnerAccess(userId: string, partnerId: string): Promise<boolean>;
  };
}
