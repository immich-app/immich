import 'package:immich_mobile/domain/models/store.model.dart';

enum Setting<T> {
  tilesPerRow<int>(StoreKey.tilesPerRow, 4),
  showStorageIndicator<bool>(StoreKey.storageIndicator, true);

  const Setting(this.storeKey, this.defaultValue);

  final StoreKey<T> storeKey;
  final T defaultValue;
}
