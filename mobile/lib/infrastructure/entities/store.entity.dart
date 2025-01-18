import 'package:immich_mobile/domain/exceptions/store.exception.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:isar/isar.dart';

part 'store.entity.g.dart';

@Collection(accessor: 'store')
class StoreEntity {
  final Id id;
  final int? intValue;
  final String? strValue;

  const StoreEntity({required this.id, this.intValue, this.strValue});

  StoreUpdateEvent toUpdateEvent() {
    final key = StoreKey.values.firstWhere((e) => e.id == id);
    final value = toValue(key);
    return StoreUpdateEvent(key, value);
  }

  T? toValue<T>(StoreKey<T> key) => switch (key.type) {
        const (int) => intValue,
        const (String) => strValue,
        const (bool) => intValue == 1,
        const (DateTime) => intValue == null
            ? null
            : DateTime.fromMillisecondsSinceEpoch(intValue!),
        _ => null,
      } as T?;

  static StoreEntity fromValue<T>(StoreKey<T> key, T value) {
    return switch (key.type) {
      const (int) =>
        StoreEntity(id: key.id, intValue: value as int, strValue: null),
      const (String) =>
        StoreEntity(id: key.id, intValue: null, strValue: value as String),
      const (bool) => StoreEntity(
          id: key.id,
          intValue: (value as bool) ? 1 : 0,
          strValue: null,
        ),
      const (DateTime) => StoreEntity(
          id: key.id,
          intValue: (value as DateTime).millisecondsSinceEpoch,
          strValue: null,
        ),
      _ => throw StoreUnkownTypeException(key),
    };
  }
}
