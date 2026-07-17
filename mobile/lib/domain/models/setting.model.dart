import 'package:immich_mobile/domain/models/store.model.dart';

enum Setting<T> {
  advancedTroubleshooting<bool>(StoreKey.advancedTroubleshooting, false);

  const Setting(this.storeKey, this.defaultValue);

  final StoreKey<T> storeKey;
  final T defaultValue;
}
