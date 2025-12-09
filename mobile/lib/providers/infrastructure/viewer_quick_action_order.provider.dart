import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/action_button.utils.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'viewer_quick_action_order.provider.g.dart';

@Riverpod(keepAlive: true)
class ViewerQuickActionOrder extends _$ViewerQuickActionOrder {
  StreamSubscription<List<ActionButtonType>>? _subscription;

  @override
  List<ActionButtonType> build() {
    final service = ref.watch(appSettingsServiceProvider);
    final initial = ActionButtonBuilder.normalizeQuickActionOrder(
      service.getSetting(AppSettingsEnum.viewerQuickActionOrder),
    );

    _subscription ??= service.watchSetting(AppSettingsEnum.viewerQuickActionOrder).listen((order) {
      state = ActionButtonBuilder.normalizeQuickActionOrder(order);
    });

    ref.onDispose(() {
      _subscription?.cancel();
      _subscription = null;
    });

    return initial;
  }

  Future<void> setOrder(List<ActionButtonType> order) async {
    final normalized = ActionButtonBuilder.normalizeQuickActionOrder(order);

    if (listEquals(state, normalized)) {
      return;
    }

    final previous = state;
    state = normalized;

    try {
      await ref.read(appSettingsServiceProvider).setSetting(AppSettingsEnum.viewerQuickActionOrder, normalized);
    } catch (error) {
      state = previous;
      rethrow;
    }
  }
}

/// Mock class for testing
abstract class ViewerQuickActionOrderInternal extends _$ViewerQuickActionOrder {}
