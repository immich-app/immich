import 'dart:convert';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/utils/action_button.utils.dart';

class ActionButtonOrderRepository {
  const ActionButtonOrderRepository();

  static const storeKey = StoreKey.viewerQuickActionOrder;

  List<ActionButtonType> get() {
    final json = Store.tryGet(storeKey);
    if (json == null || json.isEmpty) {
      return ActionButtonBuilder.defaultQuickActionOrder;
    }

    final deserialized = _deserialize(json);
    return deserialized.isEmpty ? ActionButtonBuilder.defaultQuickActionOrder : deserialized;
  }

  Future<void> set(List<ActionButtonType> order) async {
    final json = _serialize(order);
    await Store.put(storeKey, json);
  }

  Stream<List<ActionButtonType>> watch() {
    return Store.watch(storeKey).map((json) {
      if (json == null || json.isEmpty) {
        return ActionButtonBuilder.defaultQuickActionOrder;
      }
      final deserialized = _deserialize(json);
      return deserialized.isEmpty ? ActionButtonBuilder.defaultQuickActionOrder : deserialized;
    });
  }

  String _serialize(List<ActionButtonType> order) {
    return jsonEncode(order.map((type) => type.name).toList());
  }

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
