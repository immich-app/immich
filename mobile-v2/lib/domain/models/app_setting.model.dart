import 'package:immich_mobile/domain/models/store.model.dart';

enum AppSettings<T> {
  appTheme<int>(StoreKey.appTheme, 10);

  const AppSettings(this.storeKey, this.defaultValue);

  final StoreKey storeKey;
  final T defaultValue;
}
