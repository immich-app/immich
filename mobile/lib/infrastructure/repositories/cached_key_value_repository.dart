import 'package:collection/collection.dart';
import 'package:drift/drift.dart';
import 'package:immich_mobile/utils/async_mutex.dart';
// ignore: depend_on_referenced_packages
import 'package:meta/meta.dart';

abstract class CachedKeyValueRepository<K extends Enum, S> {
  CachedKeyValueRepository(this._snapshot);

  S _snapshot;
  S get snapshot => _snapshot;
  @protected
  set snapshot(S value) => _snapshot = value;

  @protected
  final AsyncMutex mutex = AsyncMutex();

  List<K> get keys;

  Object decodeValue(K key, String raw);

  S buildSnapshot(Map<K, Object?> overrides);

  Selectable<({String key, String? value})> selectable();

  Stream<Set<TableUpdate>> watchChanges();

  Future<S> refresh() => mutex.run(() async => _snapshot = _build(await selectable().get()));

  Stream<S> watchSnapshot() => watchChanges().asyncMap((_) => refresh());

  S _build(List<({String key, String? value})> rows) => buildSnapshot(
    rows.fold({}, (overrides, row) {
      final key = keys.firstWhereOrNull((key) => key.name == row.key);
      if (key == null) {
        return overrides;
      }

      Object? decodedValue;
      if (row.value != null) {
        decodedValue = decodeValue(key, row.value!);
      }

      return {...overrides, key: decodedValue};
    }),
  );
}
