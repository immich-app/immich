import 'package:immich_mobile/domain/models/user.model.dart';

/// Key for each possible value in the `Store`.
/// Defines the data type for each value
enum StoreKey<T> {
  version<int>._(0),
  assetETag<String>._(1),
  currentUser<UserDto>._(2),
  deviceIdHash<int>._(3),
  deviceId<String>._(4),
  backupFailedSince<DateTime>._(5),
  backupRequireWifi<bool>._(6),
  backupRequireCharging<bool>._(7),
  backupTriggerDelay<int>._(8),
  serverUrl<String>._(10),
  accessToken<String>._(11),
  serverEndpoint<String>._(12),
  autoBackup<bool>._(13),
  backgroundBackup<bool>._(14),
  sslClientCertData<String>._(15),
  sslClientPasswd<String>._(16),
  // user settings from [AppSettingsEnum] below:
  loadPreview<bool>._(100),
  loadOriginal<bool>._(101),
  themeMode<String>._(102),
  tilesPerRow<int>._(103),
  dynamicLayout<bool>._(104),
  groupAssetsBy<int>._(105),
  uploadErrorNotificationGracePeriod<int>._(106),
  backgroundBackupTotalProgress<bool>._(107),
  backgroundBackupSingleProgress<bool>._(108),
  storageIndicator<bool>._(109),
  thumbnailCacheSize<int>._(110),
  imageCacheSize<int>._(111),
  albumThumbnailCacheSize<int>._(112),
  selectedAlbumSortOrder<int>._(113),
  advancedTroubleshooting<bool>._(114),
  logLevel<int>._(115),
  preferRemoteImage<bool>._(116),
  loopVideo<bool>._(117),
  // map related settings
  mapShowFavoriteOnly<bool>._(118),
  mapRelativeDate<int>._(119),
  selfSignedCert<bool>._(120),
  mapIncludeArchived<bool>._(121),
  ignoreIcloudAssets<bool>._(122),
  selectedAlbumSortReverse<bool>._(123),
  mapThemeMode<int>._(124),
  mapwithPartners<bool>._(125),
  enableHapticFeedback<bool>._(126),
  customHeaders<String>._(127),

  // theme settings
  primaryColor<String>._(128),
  dynamicTheme<bool>._(129),
  colorfulInterface<bool>._(130),

  syncAlbums<bool>._(131),

  // Auto endpoint switching
  autoEndpointSwitching<bool>._(132),
  preferredWifiName<String>._(133),
  localEndpoint<String>._(134),
  externalEndpointList<String>._(135),

  // Video settings
  loadOriginalVideo<bool>._(136),
  ;

  const StoreKey._(this.id);
  final int id;
  Type get type => T;
}

class StoreUpdateEvent<T> {
  final StoreKey<T> key;
  final T? value;

  const StoreUpdateEvent(this.key, this.value);

  @override
  String toString() {
    return '''
StoreUpdateEvent: {
  key: $key,
  value: ${value ?? '<NA>'},
}''';
  }

  @override
  bool operator ==(covariant StoreUpdateEvent<T> other) {
    if (identical(this, other)) return true;

    return other.key == key && other.value == value;
  }

  @override
  int get hashCode => key.hashCode ^ value.hashCode;
}
