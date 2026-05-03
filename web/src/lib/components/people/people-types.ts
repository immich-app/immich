export type ManagedPerson = {
  id: string;
  displayName: string;
  canonicalName?: string;
  thumbnailUrl: string;
  href: string;
  isHidden: boolean;
  isFavorite?: boolean;
  type?: string;
  species?: string | null;
  assetCount?: number;
  faceCount?: number;
  canEditPersonalProfile?: boolean;
};

export type VisibilityPerson = Pick<ManagedPerson, 'id' | 'displayName' | 'thumbnailUrl' | 'isHidden'>;

export type VisibilityChange = {
  id: string;
  isHidden: boolean;
};

export type VisibilitySaveResult = {
  successCount: number;
  failCount: number;
};
