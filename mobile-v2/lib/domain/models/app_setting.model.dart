import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/presentation/modules/theme/models/app_theme.model.dart';

enum AppSetting<T> {
  appTheme<AppTheme>(StoreKey.appTheme, AppTheme.blue),
  themeMode<ThemeMode>(StoreKey.themeMode, ThemeMode.system),
  darkMode<bool>(StoreKey.darkMode, false);

  const AppSetting(this.storeKey, this.defaultValue);

  // ignore: avoid-dynamic
  final StoreKey<T, dynamic> storeKey;
  final T defaultValue;
}
