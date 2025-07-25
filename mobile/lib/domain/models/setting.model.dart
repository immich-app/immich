import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';

enum Setting<T> {
  // TODO: Remove UserDto after new store in drift
  currentUser<UserDto?>(StoreKey.currentUser, null),
  tilesPerRow<int>(StoreKey.tilesPerRow, 4),
  groupAssetsBy<int>(StoreKey.groupAssetsBy, 0),
  showStorageIndicator<bool>(StoreKey.storageIndicator, true),
  loadOriginal<bool>(StoreKey.loadOriginal, false),
  loadOriginalVideo<bool>(StoreKey.loadOriginalVideo, false),
  preferRemoteImage<bool>(StoreKey.preferRemoteImage, false),
  advancedTroubleshooting<bool>(StoreKey.advancedTroubleshooting, false),
  ;

  const Setting(this.storeKey, this.defaultValue);

  final StoreKey<T> storeKey;
  final T defaultValue;
}
