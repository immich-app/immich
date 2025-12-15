import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/quick_action.service.dart';
import 'package:immich_mobile/infrastructure/repositories/action_button_order.repository.dart';
import 'package:immich_mobile/utils/action_button.utils.dart';

final actionButtonOrderRepositoryProvider = Provider<ActionButtonOrderRepository>(
  (ref) => const ActionButtonOrderRepository(),
);

final quickActionServiceProvider = Provider<QuickActionService>(
  (ref) => QuickActionService(ref.watch(actionButtonOrderRepositoryProvider)),
);

final viewerQuickActionOrderProvider = StateNotifierProvider<ViewerQuickActionOrderNotifier, List<ActionButtonType>>(
  (ref) => ViewerQuickActionOrderNotifier(ref.watch(quickActionServiceProvider)),
);

class ViewerQuickActionOrderNotifier extends StateNotifier<List<ActionButtonType>> {
  final QuickActionService _service;
  StreamSubscription<List<ActionButtonType>>? _subscription;

  ViewerQuickActionOrderNotifier(this._service) : super(_service.get()) {
    _subscription = _service.watch().listen((order) {
      state = order;
    });
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }

  Future<void> setOrder(List<ActionButtonType> order) async {
    if (listEquals(state, order)) {
      return;
    }

    final previous = state;
    state = order;

    try {
      await _service.set(order);
    } catch (error) {
      state = previous;
      rethrow;
    }
  }
}
