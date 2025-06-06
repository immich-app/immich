import { AssetOrder, type UserPreferencesResponseDto } from '@immich/sdk';
import { Sync } from 'factory.ts';

export const preferencesFactory = Sync.makeFactory<UserPreferencesResponseDto>({
  albums: {
    defaultAssetOrder: AssetOrder.Desc,
  },
  cast: {
    gCastEnabled: false,
  },
  download: {
    archiveSize: 0,
    includeEmbeddedVideos: false,
  },
  emailNotifications: {
    albumInvite: false,
    albumUpdate: false,
    enabled: false,
  },
  folders: {
    enabled: false,
    sidebarWeb: false,
  },
  memories: {
    enabled: false,
  },
  people: {
    enabled: false,
    sidebarWeb: false,
  },
  purchase: {
    hideBuyButtonUntil: '',
    showSupportBadge: false,
  },
  ratings: {
    enabled: false,
  },
  sharedLinks: {
    enabled: false,
    sidebarWeb: false,
  },
  tags: {
    enabled: false,
    sidebarWeb: false,
  },
});
