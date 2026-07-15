import 'package:flutter/material.dart';
import 'package:immich_mobile/constants/colors.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/config/album_config.dart';
import 'package:immich_mobile/domain/models/config/backup_config.dart';
import 'package:immich_mobile/domain/models/config/cleanup_config.dart';
import 'package:immich_mobile/domain/models/config/feature_message_config.dart';
import 'package:immich_mobile/domain/models/config/image_config.dart';
import 'package:immich_mobile/domain/models/config/map_config.dart';
import 'package:immich_mobile/domain/models/config/network_config.dart';
import 'package:immich_mobile/domain/models/config/share_config.dart';
import 'package:immich_mobile/domain/models/config/slideshow_config.dart';
import 'package:immich_mobile/domain/models/config/theme_config.dart';
import 'package:immich_mobile/domain/models/config/timeline_config.dart';
import 'package:immich_mobile/domain/models/config/viewer_config.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/providers/album/album_sort_by_options.provider.dart';
import 'package:immich_mobile/utils/semver.dart';

const defaultConfig = AppConfig();

class AppConfig {
  final LogLevel logLevel;
  final bool trashSyncEnabled;
  final ThemeConfig theme;
  final CleanupConfig cleanup;
  final MapConfig map;
  final TimelineConfig timeline;
  final ImageConfig image;
  final ViewerConfig viewer;
  final SlideshowConfig slideshow;
  final AlbumConfig album;
  final BackupConfig backup;
  final NetworkConfig network;
  final ShareConfig share;
  final FeatureMessageConfig featureMessage;

  const AppConfig({
    this.logLevel = .info,
    this.trashSyncEnabled = false,
    this.theme = const .new(),
    this.cleanup = const .new(),
    this.map = const .new(),
    this.timeline = const .new(),
    this.image = const .new(),
    this.viewer = const .new(),
    this.slideshow = const .new(),
    this.album = const .new(),
    this.backup = const .new(),
    this.network = const .new(),
    this.share = const .new(),
    this.featureMessage = const .new(),
  });

  AppConfig copyWith({
    LogLevel? logLevel,
    bool? trashSyncEnabled,
    ThemeConfig? theme,
    CleanupConfig? cleanup,
    MapConfig? map,
    TimelineConfig? timeline,
    ImageConfig? image,
    ViewerConfig? viewer,
    SlideshowConfig? slideshow,
    AlbumConfig? album,
    BackupConfig? backup,
    NetworkConfig? network,
    ShareConfig? share,
    FeatureMessageConfig? featureMessage,
  }) => .new(
    logLevel: logLevel ?? this.logLevel,
    trashSyncEnabled: trashSyncEnabled ?? this.trashSyncEnabled,
    theme: theme ?? this.theme,
    cleanup: cleanup ?? this.cleanup,
    map: map ?? this.map,
    timeline: timeline ?? this.timeline,
    image: image ?? this.image,
    viewer: viewer ?? this.viewer,
    slideshow: slideshow ?? this.slideshow,
    album: album ?? this.album,
    backup: backup ?? this.backup,
    network: network ?? this.network,
    share: share ?? this.share,
    featureMessage: featureMessage ?? this.featureMessage,
  );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is AppConfig &&
          other.logLevel == logLevel &&
          other.trashSyncEnabled == trashSyncEnabled &&
          other.theme == theme &&
          other.cleanup == cleanup &&
          other.map == map &&
          other.timeline == timeline &&
          other.image == image &&
          other.viewer == viewer &&
          other.slideshow == slideshow &&
          other.album == album &&
          other.backup == backup &&
          other.network == network &&
          other.share == share &&
          other.featureMessage == featureMessage);

  @override
  int get hashCode => Object.hash(
    logLevel,
    trashSyncEnabled,
    theme,
    cleanup,
    map,
    timeline,
    image,
    viewer,
    slideshow,
    album,
    backup,
    network,
    share,
    featureMessage,
  );

  @override
  String toString() =>
      'AppConfig(logLevel: $logLevel, trashSyncEnabled: $trashSyncEnabled, theme: $theme, cleanup: $cleanup, map: $map, timeline: $timeline, image: $image, viewer: $viewer, slideshow: $slideshow, album: $album, backup: $backup, network: $network, share: $share, featureMessage: $featureMessage)';

  T read<T>(SettingsKey<T> key) =>
      (switch (key) {
            .logLevel => logLevel,
            .trashSyncEnabled => trashSyncEnabled,
            .themePrimaryColor => theme.primaryColor,
            .themeMode => theme.mode,
            .themeDynamic => theme.dynamicTheme,
            .themeColorfulInterface => theme.colorfulInterface,
            .imagePreferRemote => image.preferRemote,
            .imageLoadOriginal => image.loadOriginal,
            .viewerLoopVideo => viewer.loopVideo,
            .viewerLoadOriginalVideo => viewer.loadOriginalVideo,
            .viewerAutoPlayVideo => viewer.autoPlayVideo,
            .viewerTapToNavigate => viewer.tapToNavigate,
            .networkAutoEndpointSwitching => network.autoEndpointSwitching,
            .networkPreferredWifiName => network.preferredWifiName,
            .networkLocalEndpoint => network.localEndpoint,
            .networkExternalEndpointList => network.externalEndpointList,
            .networkCustomHeaders => network.customHeaders,
            .albumSortMode => album.sortMode,
            .albumIsReverse => album.isReverse,
            .albumIsGrid => album.isGrid,
            .backupEnabled => backup.enabled,
            .backupUseCellularForVideos => backup.useCellularForVideos,
            .backupUseCellularForPhotos => backup.useCellularForPhotos,
            .backupRequireCharging => backup.requireCharging,
            .backupTriggerDelay => backup.triggerDelay,
            .backupSyncAlbums => backup.syncAlbums,
            .timelineTilesPerRow => timeline.tilesPerRow,
            .timelineGroupAssetsBy => timeline.groupAssetsBy,
            .timelineStorageIndicator => timeline.storageIndicator,
            .mapShowFavoriteOnly => map.favoritesOnly,
            .mapRelativeDate => map.relativeDays,
            .mapIncludeArchived => map.includeArchived,
            .mapThemeMode => map.themeMode,
            .mapWithPartners => map.withPartners,
            .cleanupKeepFavorites => cleanup.keepFavorites,
            .cleanupKeepMediaType => cleanup.keepMediaType,
            .cleanupKeepAlbumIds => cleanup.keepAlbumIds,
            .cleanupCutoffDaysAgo => cleanup.cutoffDaysAgo,
            .cleanupDefaultsInitialized => cleanup.defaultsInitialized,
            .shareFileType => share.fileType,
            .slideshowRepeat => slideshow.repeat,
            .slideshowDuration => slideshow.duration,
            .slideshowLook => slideshow.look,
            .slideshowDirection => slideshow.direction,
            .featureMessageSeenRelease => featureMessage.seenRelease,
          })
          as T;

  factory AppConfig.fromEntries(Map<SettingsKey, Object?> overrides) =>
      overrides.entries.fold(const AppConfig(), (config, entry) => config.write(entry.key, entry.value));

  AppConfig write<T, U extends T>(SettingsKey<T> key, U value) {
    return switch (key) {
      .logLevel => copyWith(logLevel: value as LogLevel),
      .trashSyncEnabled => copyWith(trashSyncEnabled: value as bool),
      .themePrimaryColor => copyWith(theme: theme.copyWith(primaryColor: value as ImmichColorPreset)),
      .themeMode => copyWith(theme: theme.copyWith(mode: value as ThemeMode)),
      .themeDynamic => copyWith(theme: theme.copyWith(dynamicTheme: value as bool)),
      .themeColorfulInterface => copyWith(theme: theme.copyWith(colorfulInterface: value as bool)),
      .imagePreferRemote => copyWith(image: image.copyWith(preferRemote: value as bool)),
      .imageLoadOriginal => copyWith(image: image.copyWith(loadOriginal: value as bool)),
      .viewerLoopVideo => copyWith(viewer: viewer.copyWith(loopVideo: value as bool)),
      .viewerLoadOriginalVideo => copyWith(viewer: viewer.copyWith(loadOriginalVideo: value as bool)),
      .viewerAutoPlayVideo => copyWith(viewer: viewer.copyWith(autoPlayVideo: value as bool)),
      .viewerTapToNavigate => copyWith(viewer: viewer.copyWith(tapToNavigate: value as bool)),
      .networkAutoEndpointSwitching => copyWith(network: network.copyWith(autoEndpointSwitching: value as bool)),
      .networkPreferredWifiName => copyWith(
        network: network.copyWith(preferredWifiName: .fromNullable((value as String?))),
      ),
      .networkLocalEndpoint => copyWith(network: network.copyWith(localEndpoint: .fromNullable((value as String?)))),
      .networkExternalEndpointList => copyWith(network: network.copyWith(externalEndpointList: value as List<String>)),
      .networkCustomHeaders => copyWith(network: network.copyWith(customHeaders: value as Map<String, String>)),
      .albumSortMode => copyWith(album: album.copyWith(sortMode: value as AlbumSortMode)),
      .albumIsReverse => copyWith(album: album.copyWith(isReverse: value as bool)),
      .albumIsGrid => copyWith(album: album.copyWith(isGrid: value as bool)),
      .backupEnabled => copyWith(backup: backup.copyWith(enabled: value as bool)),
      .backupUseCellularForVideos => copyWith(backup: backup.copyWith(useCellularForVideos: value as bool)),
      .backupUseCellularForPhotos => copyWith(backup: backup.copyWith(useCellularForPhotos: value as bool)),
      .backupRequireCharging => copyWith(backup: backup.copyWith(requireCharging: value as bool)),
      .backupTriggerDelay => copyWith(backup: backup.copyWith(triggerDelay: value as int)),
      .backupSyncAlbums => copyWith(backup: backup.copyWith(syncAlbums: value as bool)),
      .timelineTilesPerRow => copyWith(timeline: timeline.copyWith(tilesPerRow: value as int)),
      .timelineGroupAssetsBy => copyWith(timeline: timeline.copyWith(groupAssetsBy: value as GroupAssetsBy)),
      .timelineStorageIndicator => copyWith(timeline: timeline.copyWith(storageIndicator: value as bool)),
      .mapShowFavoriteOnly => copyWith(map: map.copyWith(favoritesOnly: value as bool)),
      .mapRelativeDate => copyWith(map: map.copyWith(relativeDays: value as int)),
      .mapIncludeArchived => copyWith(map: map.copyWith(includeArchived: value as bool)),
      .mapThemeMode => copyWith(map: map.copyWith(themeMode: value as ThemeMode)),
      .mapWithPartners => copyWith(map: map.copyWith(withPartners: value as bool)),
      .cleanupKeepFavorites => copyWith(cleanup: cleanup.copyWith(keepFavorites: value as bool)),
      .cleanupKeepMediaType => copyWith(cleanup: cleanup.copyWith(keepMediaType: value as AssetKeepType)),
      .cleanupKeepAlbumIds => copyWith(cleanup: cleanup.copyWith(keepAlbumIds: value as List<String>)),
      .cleanupCutoffDaysAgo => copyWith(cleanup: cleanup.copyWith(cutoffDaysAgo: value as int)),
      .cleanupDefaultsInitialized => copyWith(cleanup: cleanup.copyWith(defaultsInitialized: value as bool)),
      .shareFileType => copyWith(share: share.copyWith(fileType: value as ShareAssetType)),
      .slideshowRepeat => copyWith(slideshow: slideshow.copyWith(repeat: value as bool)),
      .slideshowDuration => copyWith(slideshow: slideshow.copyWith(duration: value as int)),
      .slideshowLook => copyWith(slideshow: slideshow.copyWith(look: value as SlideshowLook)),
      .slideshowDirection => copyWith(slideshow: slideshow.copyWith(direction: value as SlideshowDirection)),
      .featureMessageSeenRelease => copyWith(featureMessage: featureMessage.copyWith(seenRelease: value as SemVer)),
    };
  }
}
