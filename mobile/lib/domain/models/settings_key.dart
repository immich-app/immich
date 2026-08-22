import 'package:flutter/material.dart';
import 'package:immich_mobile/constants/colors.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/models/value_codec.dart';
import 'package:immich_mobile/providers/album/album_sort_by_options.provider.dart';
import 'package:immich_mobile/utils/semver.dart';

enum SettingsKey<T> {
  // Theme
  themePrimaryColor<ImmichColorPreset>(codec: EnumCodec(ImmichColorPreset.values), sensitive: false),
  themeMode<ThemeMode>(codec: EnumCodec(ThemeMode.values), sensitive: false),
  themeDynamic<bool>(sensitive: false),
  themeColorfulInterface<bool>(sensitive: false),

  // Image
  imagePreferRemote<bool>(sensitive: false),
  imageLoadOriginal<bool>(sensitive: false),

  // Viewer
  viewerLoopVideo<bool>(sensitive: false),
  viewerLoadOriginalVideo<bool>(sensitive: false),
  viewerAutoPlayVideo<bool>(sensitive: false),
  viewerTapToNavigate<bool>(sensitive: false),

  // Network
  networkAutoEndpointSwitching<bool>(sensitive: false),
  networkExternalEndpointList<List<String>>(codec: ListCodec(PrimitiveCodec.string)),
  networkCustomHeaders<Map<String, String>>(codec: MapCodec(PrimitiveCodec.string, PrimitiveCodec.string)),
  networkPreferredWifiName<String?>(),
  networkLocalEndpoint<String?>(),

  // Album
  albumSortMode<AlbumSortMode>(codec: EnumCodec(AlbumSortMode.values), sensitive: false),
  albumIsReverse<bool>(sensitive: false),
  albumIsGrid<bool>(sensitive: false),

  // Backup
  backupEnabled<bool>(sensitive: false),
  backupUseCellularForVideos<bool>(sensitive: false),
  backupUseCellularForPhotos<bool>(sensitive: false),
  backupRequireCharging<bool>(sensitive: false),
  backupTriggerDelay<int>(sensitive: false),
  backupSyncAlbums<bool>(sensitive: false),

  // Timeline
  timelineTilesPerRow<int>(sensitive: false),
  timelineGroupAssetsBy<GroupAssetsBy>(codec: EnumCodec(GroupAssetsBy.values), sensitive: false),
  timelineStorageIndicator<bool>(sensitive: false),

  // Log
  logLevel<LogLevel>(codec: EnumCodec(LogLevel.values), sensitive: false),

  // Map
  mapShowFavoriteOnly<bool>(sensitive: false),
  mapRelativeDate<int>(sensitive: false),
  mapCustomFrom<DateTime?>(sensitive: false),
  mapCustomTo<DateTime?>(sensitive: false),
  mapIncludeArchived<bool>(sensitive: false),
  mapThemeMode<ThemeMode>(codec: EnumCodec(ThemeMode.values), sensitive: false),
  mapWithPartners<bool>(sensitive: false),

  // Cleanup
  cleanupKeepFavorites<bool>(sensitive: false),
  cleanupKeepMediaType<AssetKeepType>(codec: EnumCodec(AssetKeepType.values), sensitive: false),
  cleanupKeepAlbumIds<List<String>>(codec: ListCodec(PrimitiveCodec.string), sensitive: false),
  cleanupCutoffDaysAgo<int>(sensitive: false),
  cleanupDefaultsInitialized<bool>(sensitive: false),

  // Share
  shareFileType<ShareAssetType>(codec: EnumCodec(ShareAssetType.values), sensitive: false),

  // Slideshow
  slideshowRepeat<bool>(sensitive: false),
  slideshowDuration<int>(sensitive: false),
  slideshowLook<SlideshowLook>(codec: EnumCodec(SlideshowLook.values), sensitive: false),
  slideshowDirection<SlideshowDirection>(codec: EnumCodec(SlideshowDirection.values), sensitive: false),

  // Feature message
  featureMessageSeenRelease<SemVer>(codec: SemVerCodec(), sensitive: false);

  final ValueCodec<T>? _codecOverride;
  final bool sensitive;

  const SettingsKey({ValueCodec<T>? codec, this.sensitive = true}) : _codecOverride = codec;

  ValueCodec<T> get _codec => _codecOverride ?? ValueCodec.forType(T);

  String encode(T value) => _codec.encode(value);

  T decode(String raw) => _codec.decode(raw);
}
