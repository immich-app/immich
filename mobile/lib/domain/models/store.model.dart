import 'package:immich_mobile/domain/models/user.model.dart';

/// Key for each possible value in the `Store`.
/// Defines the data type for each value
enum StoreKey<T> {
  version<int>._(0),
  currentUser<UserDto>._(2),
  deviceId<String>._(4),
  backupRequireCharging<bool>._(7),
  backupTriggerDelay<int>._(8),
  serverUrl<String>._(10),
  accessToken<String>._(11),
  serverEndpoint<String>._(12),
  selectedAlbumSortOrder<int>._(113),
  advancedTroubleshooting<bool>._(114),
  selectedAlbumSortReverse<bool>._(123),
  enableHapticFeedback<bool>._(126),
  customHeaders<String>._(127),
  syncAlbums<bool>._(131),

  // Auto endpoint switching
  autoEndpointSwitching<bool>._(132),
  preferredWifiName<String>._(133),
  localEndpoint<String>._(134),
  externalEndpointList<String>._(135),

  manageLocalMediaAndroid<bool>._(137),
  // Read-only Mode settings
  readonlyModeEnabled<bool>._(138),
  albumGridView<bool>._(140),

  // Experimental stuff
  enableBackup<bool>._(1003),
  useWifiForUploadVideos<bool>._(1004),
  useWifiForUploadPhotos<bool>._(1005),
  syncMigrationStatus<String>._(1013),

  // Legacy keys that have been migrated to the new metadata store
  legacyLoopVideo<bool>._(117),
  legacyLoadOriginalVideo<bool>._(136),
  legacyAutoPlayVideo<bool>._(139),
  legacyTapToNavigate<bool>._(141),
  legacyPreferRemoteImage<bool>._(116),
  legacyLoadOriginal<bool>._(101),
  legacyPrimaryColor<String>._(128),
  legacyDynamicTheme<bool>._(129),
  legacyColorfulInterface<bool>._(130),
  legacyThemeMode<String>._(102),
  legacyCleanupKeepFavorites<bool>._(1008),
  legacyCleanupKeepMediaType<int>._(1009),
  legacyCleanupKeepAlbumIds<String>._(1010),
  legacyCleanupCutoffDaysAgo<int>._(1011),
  legacyCleanupDefaultsInitialized<bool>._(1012),
  legacyTilesPerRow<int>._(103),
  legacyGroupAssetsBy<int>._(105),
  legacyStorageIndicator<bool>._(109),
  legacyMapRelativeDate<int>._(119),
  legacyMapShowFavoriteOnly<bool>._(118),
  legacyMapIncludeArchived<bool>._(121),
  legacyMapThemeMode<int>._(124),
  legacyMapwithPartners<bool>._(125),
  legacyLogLevel<int>._(115);

  const StoreKey._(this.id);
  final int id;
  Type get type => T;
}

class StoreDto<T> {
  final StoreKey<T> key;
  final T? value;

  const StoreDto(this.key, this.value);

  @override
  String toString() {
    return '''
StoreDto: {
  key: $key,
  value: ${value ?? '<NA>'},
}''';
  }

  @override
  bool operator ==(covariant StoreDto<T> other) {
    if (identical(this, other)) {
      return true;
    }

    return other.key == key && other.value == value;
  }

  @override
  int get hashCode => key.hashCode ^ value.hashCode;
}
