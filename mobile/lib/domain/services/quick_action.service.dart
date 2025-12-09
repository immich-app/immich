import 'package:immich_mobile/infrastructure/repositories/action_button_order.repository.dart';
import 'package:immich_mobile/utils/action_button.utils.dart';

/// Service for managing quick action configurations.
/// Provides business logic for building quick action types based on context.
class QuickActionService {
  final ActionButtonOrderRepository _repository;

  const QuickActionService(this._repository);

  // Constants
  static const int defaultQuickActionLimit = 4;

  static const List<ActionButtonType> defaultQuickActionSeed = [
    ActionButtonType.share,
    ActionButtonType.upload,
    ActionButtonType.edit,
    ActionButtonType.add,
    ActionButtonType.archive,
    ActionButtonType.delete,
    ActionButtonType.removeFromAlbum,
    ActionButtonType.likeActivity,
  ];

  static final Set<ActionButtonType> _quickActionSet = Set<ActionButtonType>.unmodifiable(defaultQuickActionSeed);

  static final List<ActionButtonType> defaultQuickActionOrder = List<ActionButtonType>.unmodifiable(
    defaultQuickActionSeed,
  );

  /// Get the list of available quick action options
  // static List<ActionButtonType> get quickActionOptions => defaultQuickActionOrder;

  /// Get the current quick action order
  List<ActionButtonType> get() {
    return _repository.get();
  }

  /// Set the quick action order
  Future<void> set(List<ActionButtonType> order) async {
    final normalized = _normalizeQuickActionOrder(order);
    await _repository.set(normalized);
  }

  /// Watch for changes to quick action order
  Stream<List<ActionButtonType>> watch() {
    return _repository.watch();
  }

  /// Normalize quick action order by filtering valid types and ensuring all defaults are included
  List<ActionButtonType> _normalizeQuickActionOrder(List<ActionButtonType> order) {
    final ordered = <ActionButtonType>{};

    for (final type in order) {
      if (_quickActionSet.contains(type)) {
        ordered.add(type);
      }
    }

    ordered.addAll(defaultQuickActionSeed);

    return ordered.toList(growable: false);
  }

  /// Build a list of quick action types based on context and custom order
  List<ActionButtonType> buildQuickActionTypes(
    ActionButtonContext context, {
    List<ActionButtonType>? quickActionOrder,
    int limit = defaultQuickActionLimit,
  }) {
    final normalized = _normalizeQuickActionOrder(
      quickActionOrder == null || quickActionOrder.isEmpty ? defaultQuickActionOrder : quickActionOrder,
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
