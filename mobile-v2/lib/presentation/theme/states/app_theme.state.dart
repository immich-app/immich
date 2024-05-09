import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/models/app_setting.model.dart';
import 'package:immich_mobile/domain/services/app_setting.service.dart';
import 'package:immich_mobile/presentation/theme/utils/colors.dart';

class AppThemeState extends ValueNotifier<AppTheme> {
  final AppSettingsService _appSettings;
  StreamSubscription? _appSettingSubscription;

  AppThemeState({required AppSettingsService appSettings})
      : _appSettings = appSettings,
        super(AppTheme.blue);

  void init() {
    _appSettingSubscription =
        _appSettings.watchSetting(AppSettings.appTheme).listen((themeIndex) {
      final theme =
          AppTheme.values.elementAtOrNull(themeIndex) ?? AppTheme.blue;
      value = theme;
    });
  }

  @override
  void dispose() {
    _appSettingSubscription?.cancel();
    return super.dispose();
  }
}
