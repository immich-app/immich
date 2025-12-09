import 'package:immich_mobile/infrastructure/repositories/action_button_order.repository.dart';
import 'package:immich_mobile/utils/action_button.utils.dart';

class QuickActionService {
  final ActionButtonOrderRepository _repository;

  const QuickActionService(this._repository);

  static final Set<ActionButtonType> _quickActionSet = Set<ActionButtonType>.unmodifiable(
    ActionButtonBuilder.defaultQuickActionOrder,
  );

  List<ActionButtonType> get() {
    return _repository.get();
  }

  Future<void> set(List<ActionButtonType> order) async {
    final normalized = _normalizeQuickActionOrder(order);
    await _repository.set(normalized);
  }

  Stream<List<ActionButtonType>> watch() {
    return _repository.watch();
  }

  List<ActionButtonType> _normalizeQuickActionOrder(List<ActionButtonType> order) {
    final ordered = <ActionButtonType>{};

    for (final type in order) {
      if (_quickActionSet.contains(type)) {
        ordered.add(type);
      }
    }

    ordered.addAll(ActionButtonBuilder.defaultQuickActionOrder);

    return ordered.toList(growable: false);
  }

  List<ActionButtonType> buildQuickActionTypes(
    ActionButtonContext context, {
    List<ActionButtonType>? quickActionOrder,
    int limit = ActionButtonBuilder.defaultQuickActionLimit,
  }) {
    final normalized = _normalizeQuickActionOrder(
      quickActionOrder == null || quickActionOrder.isEmpty
          ? ActionButtonBuilder.defaultQuickActionOrder
          : quickActionOrder,
    );

    final seen = <ActionButtonType>{};
    final result = <ActionButtonType>[];

    for (final type in normalized) {
      if (!_quickActionSet.contains(type)) {
        continue;
      }

      final resolved = _resolveQuickActionType(type, context);
      if (!seen.add(resolved) || !resolved.shouldShow(context)) {
        continue;
      }

      result.add(resolved);
      if (result.length >= limit) {
        break;
      }
    }

    return result;
  }

  /// Resolve quick action type based on context (e.g., archive -> unarchive)
  ActionButtonType _resolveQuickActionType(ActionButtonType type, ActionButtonContext context) {
    if (type == ActionButtonType.archive && context.isArchived) {
      return ActionButtonType.unarchive;
    }

    if (type == ActionButtonType.delete && context.asset.isLocalOnly) {
      return ActionButtonType.deleteLocal;
    }

    return type;
  }
}
