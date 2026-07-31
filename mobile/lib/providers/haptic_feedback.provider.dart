import 'dart:async';

import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';

final hapticFeedbackProvider = StateNotifierProvider<HapticNotifier, void>((ref) {
  return HapticNotifier(ref);
});

class HapticNotifier extends StateNotifier<void> {
  void build() {}
  final Ref _ref;

  HapticNotifier(this._ref) : super(null);

  void selectionClick() {
    if (_ref.read(appSettingsServiceProvider).getSetting(AppSettingsEnum.enableHapticFeedback)) {
      unawaited(HapticFeedback.selectionClick());
    }
  }

  void lightImpact() {
    if (_ref.read(appSettingsServiceProvider).getSetting(AppSettingsEnum.enableHapticFeedback)) {
      unawaited(HapticFeedback.lightImpact());
    }
  }

  void mediumImpact() {
    if (_ref.read(appSettingsServiceProvider).getSetting(AppSettingsEnum.enableHapticFeedback)) {
      unawaited(HapticFeedback.mediumImpact());
    }
  }

  void heavyImpact() {
    if (_ref.read(appSettingsServiceProvider).getSetting(AppSettingsEnum.enableHapticFeedback)) {
      unawaited(HapticFeedback.heavyImpact());
    }
  }

  void vibrate() {
    if (_ref.read(appSettingsServiceProvider).getSetting(AppSettingsEnum.enableHapticFeedback)) {
      unawaited(HapticFeedback.vibrate());
    }
  }
}
