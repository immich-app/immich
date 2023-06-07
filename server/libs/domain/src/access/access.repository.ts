export const IAccessRepository = 'IAccessRepository';

export interface IAccessRepository {
  hasPartnerAccess(userId: string, partnerId: string): Promise<boolean>;
  hasPartnerAssetAccess(userId: string, assetId: string): Promise<boolean>;
  hasSharedLinkAssetAccess(userId: string, assetId: string): Promise<boolean>;
}
