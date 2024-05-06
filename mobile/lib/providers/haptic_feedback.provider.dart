import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';

final hapticFeedbackProvider =
    StateNotifierProvider<HapticNotifier, void>((ref) {
  return HapticNotifier(ref);
});

class HapticNotifier extends StateNotifier<void> {
  void build() {}
  final Ref _ref;

  HapticNotifier(this._ref) : super(null);

  selectionClick() {
    if (_ref
        .read(appSettingsServiceProvider)
        .getSetting(AppSettingsEnum.enableHapticFeedback)) {
      HapticFeedback.selectionClick();
    }
  }

  lightImpact() {
    if (_ref
        .read(appSettingsServiceProvider)
        .getSetting(AppSettingsEnum.enableHapticFeedback)) {
      HapticFeedback.lightImpact();
    }
  }

  mediumImpact() {
    if (_ref
        .read(appSettingsServiceProvider)
        .getSetting(AppSettingsEnum.enableHapticFeedback)) {
      HapticFeedback.mediumImpact();
    }
  }

  heavyImpact() {
    if (_ref
        .read(appSettingsServiceProvider)
        .getSetting(AppSettingsEnum.enableHapticFeedback)) {
      HapticFeedback.heavyImpact();
    }
  }

  vibrate() {
    if (_ref
        .read(appSettingsServiceProvider)
        .getSetting(AppSettingsEnum.enableHapticFeedback)) {
      HapticFeedback.vibrate();
    }
  }
}
