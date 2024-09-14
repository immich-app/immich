import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/presentation/modules/theme/models/app_theme.model.dart';

// AppSetting needs to store UI specific settings as well as domain specific settings
// This model is the only exclusion which refers to entities from the presentation layer
// as well as the domain layer
enum AppSetting<T> {
  appTheme<AppTheme>(StoreKey.appTheme, AppTheme.blue),
  themeMode<ThemeMode>(StoreKey.themeMode, ThemeMode.system),
  darkMode<bool>(StoreKey.darkMode, false);

  const AppSetting(this.storeKey, this.defaultValue);

  // ignore: avoid-dynamic
  final StoreKey<T, dynamic> storeKey;
  final T defaultValue;
}
