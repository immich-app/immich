import 'dart:async';

import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';

final hapticFeedbackProvider = StateNotifierProvider<HapticNotifier, void>((ref) {
  return HapticNotifier(ref);
});

class HapticNotifier extends StateNotifier<void> {
  void build() {}
  final Ref _ref;

  HapticNotifier(this._ref) : super(null);

  bool get _enabled => _ref.read(appConfigProvider).advanced.enableHapticFeedback;

  void selectionClick() {
    if (_enabled) {
      unawaited(HapticFeedback.selectionClick());
    }
  }

  void lightImpact() {
    if (_enabled) {
      unawaited(HapticFeedback.lightImpact());
    }
  }

  void mediumImpact() {
    if (_enabled) {
      unawaited(HapticFeedback.mediumImpact());
    }
  }

  void heavyImpact() {
    if (_enabled) {
      unawaited(HapticFeedback.heavyImpact());
    }
  }

  void vibrate() {
    if (_enabled) {
      unawaited(HapticFeedback.vibrate());
    }
  }
}
