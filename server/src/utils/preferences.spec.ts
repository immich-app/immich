import { AssetOrder, UserMetadataKey } from 'src/enum';
import { UserMetadataItem, UserPreferences } from 'src/types';
import { HumanReadableSize } from 'src/utils/bytes';
import { getPreferences, getPreferencesPartial, mergePreferences } from 'src/utils/preferences';
import { describe, expect, it } from 'vitest';

const getDefaultPreferences = (): UserPreferences => ({
  albums: {
    defaultAssetOrder: AssetOrder.Desc,
  },
  folders: {
    enabled: false,
    sidebarWeb: false,
  },
  memories: {
    enabled: true,
    duration: 5,
  },
  people: {
    enabled: true,
    sidebarWeb: false,
  },
  sharedLinks: {
    enabled: true,
    sidebarWeb: false,
  },
  ratings: {
    enabled: false,
  },
  tags: {
    enabled: false,
    sidebarWeb: false,
  },
  emailNotifications: {
    enabled: true,
    albumInvite: true,
    albumUpdate: true,
  },
  download: {
    archiveSize: HumanReadableSize.GiB * 4,
    includeEmbeddedVideos: false,
  },
  purchase: {
    showSupportBadge: true,
    hideBuyButtonUntil: new Date(2022, 1, 12).toISOString(),
  },
  cast: {
    gCastEnabled: false,
  },
});

describe('getPreferences', () => {
  it('should return default preferences when metadata is empty', () => {
    const result = getPreferences([]);
    expect(result).toEqual(getDefaultPreferences());
  });

  it('should return default preferences when no preferences metadata item exists', () => {
    const metadata: UserMetadataItem[] = [
      { key: UserMetadataKey.License, value: { licenseKey: 'key', activationKey: 'ak', activatedAt: 'now' } },
    ];
    const result = getPreferences(metadata);
    expect(result).toEqual(getDefaultPreferences());
  });

  it('should merge a single top-level override with defaults', () => {
    const metadata: UserMetadataItem[] = [
      {
        key: UserMetadataKey.Preferences,
        value: { memories: { enabled: false } },
      },
    ];
    const result = getPreferences(metadata);
    expect(result.memories.enabled).toBe(false);
    // duration should still be default
    expect(result.memories.duration).toBe(5);
  });

  it('should override a nested property while keeping sibling defaults', () => {
    const metadata: UserMetadataItem[] = [
      {
        key: UserMetadataKey.Preferences,
        value: { emailNotifications: { albumInvite: false } },
      },
    ];
    const result = getPreferences(metadata);
    expect(result.emailNotifications.albumInvite).toBe(false);
    expect(result.emailNotifications.enabled).toBe(true);
    expect(result.emailNotifications.albumUpdate).toBe(true);
  });

  it('should override multiple sections at once', () => {
    const metadata: UserMetadataItem[] = [
      {
        key: UserMetadataKey.Preferences,
        value: {
          folders: { enabled: true, sidebarWeb: true },
          tags: { enabled: true },
          ratings: { enabled: true },
        },
      },
    ];
    const result = getPreferences(metadata);
    expect(result.folders.enabled).toBe(true);
    expect(result.folders.sidebarWeb).toBe(true);
    expect(result.tags.enabled).toBe(true);
    expect(result.tags.sidebarWeb).toBe(false);
    expect(result.ratings.enabled).toBe(true);
  });

  it('should override the album sort order', () => {
    const metadata: UserMetadataItem[] = [
      {
        key: UserMetadataKey.Preferences,
        value: { albums: { defaultAssetOrder: AssetOrder.Asc } },
      },
    ];
    const result = getPreferences(metadata);
    expect(result.albums.defaultAssetOrder).toBe(AssetOrder.Asc);
  });

  it('should override download archive size', () => {
    const customSize = HumanReadableSize.GiB * 8;
    const metadata: UserMetadataItem[] = [
      {
        key: UserMetadataKey.Preferences,
        value: { download: { archiveSize: customSize } },
      },
    ];
    const result = getPreferences(metadata);
    expect(result.download.archiveSize).toBe(customSize);
    expect(result.download.includeEmbeddedVideos).toBe(false);
  });

  it('should override purchase preferences', () => {
    const metadata: UserMetadataItem[] = [
      {
        key: UserMetadataKey.Preferences,
        value: { purchase: { showSupportBadge: false } },
      },
    ];
    const result = getPreferences(metadata);
    expect(result.purchase.showSupportBadge).toBe(false);
  });

  it('should override cast preferences', () => {
    const metadata: UserMetadataItem[] = [
      {
        key: UserMetadataKey.Preferences,
        value: { cast: { gCastEnabled: true } },
      },
    ];
    const result = getPreferences(metadata);
    expect(result.cast.gCastEnabled).toBe(true);
  });
});

describe('getPreferencesPartial', () => {
  it('should return an empty object when all values match defaults', () => {
    const defaults = getDefaultPreferences();
    const result = getPreferencesPartial(defaults);
    expect(result).toEqual({});
  });

  it('should return only the changed properties', () => {
    const preferences = getDefaultPreferences();
    preferences.memories.enabled = false;
    const result = getPreferencesPartial(preferences);
    expect(result).toEqual({ memories: { enabled: false } });
  });

  it('should return multiple changed properties across sections', () => {
    const preferences = getDefaultPreferences();
    preferences.folders.enabled = true;
    preferences.tags.enabled = true;
    preferences.ratings.enabled = true;
    const result = getPreferencesPartial(preferences);
    expect(result).toEqual({
      folders: { enabled: true },
      tags: { enabled: true },
      ratings: { enabled: true },
    });
  });

  it('should exclude null and empty string values', () => {
    const preferences = getDefaultPreferences();
    (preferences as any).memories.duration = null;
    (preferences as any).folders.enabled = '';
    const result = getPreferencesPartial(preferences);
    // null and empty string are treated as "empty" so they shouldn't appear
    expect(result).not.toHaveProperty('memories.duration');
    expect(result).not.toHaveProperty('folders.enabled');
  });

  it('should exclude undefined values', () => {
    const preferences = getDefaultPreferences();
    (preferences as any).memories.duration = undefined;
    const result = getPreferencesPartial(preferences);
    expect(result).not.toHaveProperty('memories.duration');
  });

  it('should detect a changed download archive size', () => {
    const preferences = getDefaultPreferences();
    preferences.download.archiveSize = HumanReadableSize.GiB * 2;
    const result = getPreferencesPartial(preferences);
    expect(result).toEqual({ download: { archiveSize: HumanReadableSize.GiB * 2 } });
  });

  it('should detect a changed asset order', () => {
    const preferences = getDefaultPreferences();
    preferences.albums.defaultAssetOrder = AssetOrder.Asc;
    const result = getPreferencesPartial(preferences);
    expect(result).toEqual({ albums: { defaultAssetOrder: AssetOrder.Asc } });
  });
});

describe('mergePreferences', () => {
  it('should apply dto changes to the preferences object', () => {
    const preferences = getDefaultPreferences();
    const dto = { memories: { enabled: false } };
    const result = mergePreferences(preferences, dto as any);
    expect(result.memories.enabled).toBe(false);
    expect(result.memories.duration).toBe(5);
  });

  it('should return the same reference', () => {
    const preferences = getDefaultPreferences();
    const dto = { tags: { enabled: true } };
    const result = mergePreferences(preferences, dto as any);
    expect(result).toBe(preferences);
  });

  it('should apply multiple changes from the dto', () => {
    const preferences = getDefaultPreferences();
    const dto = {
      folders: { enabled: true, sidebarWeb: true },
      people: { sidebarWeb: true },
      cast: { gCastEnabled: true },
    };
    const result = mergePreferences(preferences, dto as any);
    expect(result.folders.enabled).toBe(true);
    expect(result.folders.sidebarWeb).toBe(true);
    expect(result.people.sidebarWeb).toBe(true);
    expect(result.people.enabled).toBe(true);
    expect(result.cast.gCastEnabled).toBe(true);
  });

  it('should not modify properties not present in the dto', () => {
    const preferences = getDefaultPreferences();
    const original = getDefaultPreferences();
    const dto = { memories: { enabled: false } };
    mergePreferences(preferences, dto as any);
    expect(preferences.folders).toEqual(original.folders);
    expect(preferences.tags).toEqual(original.tags);
    expect(preferences.emailNotifications).toEqual(original.emailNotifications);
  });

  it('should handle an empty dto without changing anything', () => {
    const preferences = getDefaultPreferences();
    const original = getDefaultPreferences();
    mergePreferences(preferences, {} as any);
    expect(preferences).toEqual(original);
  });
});
