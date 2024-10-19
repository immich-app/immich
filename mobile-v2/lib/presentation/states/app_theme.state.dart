import 'dart:async';

import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/app_setting.model.dart';
import 'package:immich_mobile/domain/services/app_setting.service.dart';
import 'package:immich_mobile/presentation/theme/app_theme.dart';

class AppThemeProvider extends ValueNotifier<AppTheme> {
  final AppSettingService _appSettings;
  late final StreamSubscription _appSettingSubscription;

  AppThemeProvider({required AppSettingService settingsService})
      : _appSettings = settingsService,
        super(AppTheme.blue) {
    _appSettingSubscription = _appSettings
        .watch(AppSetting.appTheme)
        .listen((theme) => value = theme);
  }

  @override
  void dispose() {
    _appSettingSubscription.cancel();
    super.dispose();
  }
}
