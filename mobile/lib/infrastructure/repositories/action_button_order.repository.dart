import 'dart:convert';

import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/utils/action_button.utils.dart';

/// Repository for managing quick action button order persistence.
/// Handles serialization, deserialization, and storage operations.
class ActionButtonOrderRepository {
  const ActionButtonOrderRepository();

  /// Default order for quick actions
  static const List<ActionButtonType> defaultOrder = [
    ActionButtonType.share,
    ActionButtonType.upload,
    ActionButtonType.edit,
    ActionButtonType.add,
    ActionButtonType.archive,
    ActionButtonType.delete,
    ActionButtonType.removeFromAlbum,
    ActionButtonType.likeActivity,
  ];

  /// Get the current quick action order from storage
  List<ActionButtonType> get() {
    final json = Store.tryGet(StoreKey.viewerQuickActionOrder);
    if (json == null || json.isEmpty) {
      return defaultOrder;
    }

    final deserialized = _deserialize(json);
    return deserialized.isEmpty ? defaultOrder : deserialized;
  }

  /// Save quick action order to storage
  Future<void> set(List<ActionButtonType> order) async {
    final json = _serialize(order);
    await Store.put(StoreKey.viewerQuickActionOrder, json);
  }

  /// Watch for changes to quick action order
  Stream<List<ActionButtonType>> watch() {
    return Store.watch(StoreKey.viewerQuickActionOrder).map((json) {
      if (json == null || json.isEmpty) {
        return defaultOrder;
      }
      final deserialized = _deserialize(json);
      return deserialized.isEmpty ? defaultOrder : deserialized;
    });
  }

  /// Serialize a list of ActionButtonType to JSON string
  String _serialize(List<ActionButtonType> order) {
    return jsonEncode(order.map((type) => type.name).toList());
  }

  /// Deserialize a JSON string to a list of ActionButtonType
  List<ActionButtonType> _deserialize(String json) {
    try {
      final list = jsonDecode(json) as List<dynamic>;
      return list
          .whereType<String>()
          .map((name) {
            try {
              return ActionButtonType.values.byName(name);
            } catch (e) {
              return null;
            }
          })
          .whereType<ActionButtonType>()
          .toList();
    } catch (e) {
      return [];
    }
  }
}
